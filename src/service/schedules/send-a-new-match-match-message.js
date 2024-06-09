import { userMention } from 'discord.js';
import client from '../../client/index.js';
import config from '../../config/index.js';
import MatchMatchMessage from '../../models/match-match-message.js';
import MatchMatchTopic from '../../models/match-match-topic.js';
import Point from '../../models/point.js';

const { MATCH_MATCH_CHANNEL_ID: matchMatchChannelId, MATCH_MATCH_COMMAND_ID: matchMatchCommandId } =
  config;

const processMatchedSubmissions = (submissionsArr, matchMatchMessages) =>
  submissionsArr.map((submission) => {
    const matchedMessages = matchMatchMessages.filter(
      (msg) => msg.submission.toUpperCase() === submission,
    );
    return { submission, items: matchedMessages };
  });

const createBulkWriteOperations = (matchedArr, points) =>
  matchedArr.reduce((acc, cur) => {
    cur.items.forEach((item) => {
      acc.push({
        updateOne: {
          filter: { id: item.id },
          update: { $inc: { matchMatch: points } },
          upsert: true,
        },
      });
    });
    return acc;
  }, []);

const createDescriptionSection = (matchedArr, points, title, emoji) => {
  if (matchedArr.length === 0) return '';
  return `\n### ${title} ${emoji} (${points} points)\n${matchedArr
    .map(
      (e) =>
        `**${e.submission}**\n${e.items
          .map(
            (item) =>
              `${userMention(item.id)} ${item.submission} (${item.submissionInTargetLanguage})`,
          )
          .join('\n')}`,
    )
    .join('\n\n')}\n`;
};

const sendANewMatchMatchMessage = async () => {
  try {
    const channel = await client.channels.fetch(matchMatchChannelId);
    const matchMatchMessages = await MatchMatchMessage.find();

    if (matchMatchMessages.length === 0) {
      await channel.send({
        embeds: [
          {
            color: 0x65a69e,
            description: 'There are no users participating in the current match-match topic.',
          },
        ],
      });
      return;
    }

    const matchMatchTopics = await MatchMatchTopic.find().sort({ point: -1 }).limit(1);

    if (matchMatchTopics.length === 0) {
      await channel.send({
        embeds: [
          {
            color: 0x65a69e,
            description:
              "There's no match-match topic left.\nPlease ping the moderator to create a new topic.",
          },
        ],
      });
      return;
    }

    const matchMatchTopic = matchMatchTopics[0];

    const submissionWithCountObj = {};

    matchMatchMessages.forEach((matchMatchMessage) => {
      const upperCaseSubmission = matchMatchMessage.submission.toUpperCase();
      submissionWithCountObj[upperCaseSubmission] =
        submissionWithCountObj[upperCaseSubmission] + 1 || 1;
    });

    const [
      matchedTwoSubmissionArr,
      matchedThreeSubmissionArr,
      matchedFourSubmissionArr,
      overMatchedSubmissionArr,
    ] = Object.keys(submissionWithCountObj)
      .reduce(
        (acc, key) => {
          const count = submissionWithCountObj[key];
          if (count === 2) acc[0].push(key);
          else if (count === 3) acc[1].push(key);
          else if (count === 4) acc[2].push(key);
          else if (count > 4) acc[3].push(key);
          return acc;
        },
        [[], [], [], []],
      )
      .map((arr) => arr.sort());

    const matchedTwoDescriptionArr = processMatchedSubmissions(
      matchedTwoSubmissionArr,
      matchMatchMessages,
    );
    const matchedThreeDescriptionArr = processMatchedSubmissions(
      matchedThreeSubmissionArr,
      matchMatchMessages,
    );
    const matchedFourDescriptionArr = processMatchedSubmissions(
      matchedFourSubmissionArr,
      matchMatchMessages,
    );
    const overMatchedDescriptionArr = processMatchedSubmissions(
      overMatchedSubmissionArr,
      matchMatchMessages,
    );

    const notMachedParticipants = matchMatchMessages.filter(
      (msg) =>
        !matchedTwoSubmissionArr.includes(msg.submission.toUpperCase()) &&
        !matchedThreeSubmissionArr.includes(msg.submission.toUpperCase()) &&
        !matchedFourSubmissionArr.includes(msg.submission.toUpperCase()) &&
        !overMatchedSubmissionArr.includes(msg.submission.toUpperCase()),
    );

    const bulkWriteArr = [
      ...createBulkWriteOperations(matchedTwoDescriptionArr, 15),
      ...createBulkWriteOperations(matchedThreeDescriptionArr, 10),
      ...createBulkWriteOperations(matchedFourDescriptionArr, 5),
      ...createBulkWriteOperations(overMatchedDescriptionArr, 2),
      ...notMachedParticipants.map((item) => ({
        updateOne: {
          filter: { id: item.id },
          update: { $inc: { matchMatch: 1 } },
          upsert: true,
        },
      })),
    ];

    Point.bulkWrite(bulkWriteArr);

    const description = `# Topic: ${matchMatchTopic.topic}
    ${createDescriptionSection(
      matchedTwoDescriptionArr,
      15,
      'Matching Users',
      '😆',
    )}${createDescriptionSection(
      matchedThreeDescriptionArr,
      10,
      'Matches with 3 Users',
      '😁',
    )}${createDescriptionSection(
      matchedFourDescriptionArr,
      5,
      'Matches with 4 Users',
      '😄',
    )}${createDescriptionSection(
      overMatchedDescriptionArr,
      2,
      'Matches with More Than 4 Users',
      '😀',
    )}${
      notMachedParticipants.length > 0
        ? `\n### Users With No Match 🙂 (1 point)\n${notMachedParticipants
            .map(
              (item) =>
                `${userMention(item.id)} ${item.submission} (${item.submissionInTargetLanguage})`,
            )
            .join('\n')}`
        : ''
    }`;

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description,
        },
      ],
    });

    if (process.env.NODE_ENV === 'production') {
      await MatchMatchMessage.deleteMany();
      await MatchMatchTopic.deleteOne({ _id: matchMatchTopic._id });
    }

    const stickyMessageTitle = 'Match-match';
    const currentMessages = await channel.messages.fetch(20);
    const stickyMessages = currentMessages.filter(
      (msg) => msg?.author?.id === config.CLIENT_ID && msg?.embeds[0]?.title === stickyMessageTitle,
    );

    await Promise.all(stickyMessages.map((msg) => msg.delete().catch(() => {})));

    const currentMatchMatchTopic = await MatchMatchTopic.findOne().sort({ createdAt: 1 });
    const numberOfSubmissions = await MatchMatchMessage.countDocuments();

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          title: stickyMessageTitle,
          description: `Topic\n\`\`\`\n${
            currentMatchMatchTopic.topic
          }\n\`\`\`\nNumber of participants: \`${numberOfSubmissions}\`\n\n**Submission period ends **<t:${Math.floor(
            (() => {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              if (now.getTime() <= Date.now()) now.setDate(now.getDate() + 1);
              return now;
            })().getTime() / 1000,
          )}:R>\n\nClick </match-match:${matchMatchCommandId}> here and send it to participate\n\nHow to Play: https://discord.com/channels/739911855795077282/1244836542036443217/1244923513199005758`,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export default sendANewMatchMatchMessage;
