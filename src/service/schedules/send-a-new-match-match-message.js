import { userMention } from 'discord.js';
import client from '../../client/index.js';
import config from '../../config/index.js';
import MatchMatchMessage from '../../models/match-match-message.js';
import MatchMatchTopic from '../../models/match-match-topic.js';
import Point from '../../models/point.js';

const {
  MATCH_MATCH_CHANNEL_ID: matchMatchChannelId,

  MATCH_MATCH_COMMAND_ID: matchMatchCommandId,
} = config;

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

    let [matchedSubmissionArr, overMatchedSubmissionArr] = Object.keys(
      submissionWithCountObj,
    ).reduce(
      (pre, cur) => {
        if (submissionWithCountObj[cur] === 2) {
          pre[0].push(cur);
        } else if (submissionWithCountObj[cur] > 2) {
          pre[1].push(cur);
        }
        return pre;
      },
      [[], []],
    );

    matchedSubmissionArr = matchedSubmissionArr.sort((a, b) => a - b);
    overMatchedSubmissionArr = overMatchedSubmissionArr.sort((a, b) => a - b);

    const matchedDescriptionArr = [];

    matchedSubmissionArr.forEach((submission) => {
      const matchedMatchMatchMessages = matchMatchMessages.filter(
        (matchMatchMessage) => matchMatchMessage.submission.toUpperCase() === submission,
      );

      matchedDescriptionArr.push({
        submission,
        items: matchedMatchMatchMessages,
      });
    });

    const overMatchedDescriptionArr = [];

    overMatchedSubmissionArr.forEach((submission) => {
      const overMatchedMatchMatchMessages = matchMatchMessages.filter(
        (matchMatchMessage) => matchMatchMessage.submission.toUpperCase() === submission,
      );

      overMatchedDescriptionArr.push({
        submission,
        items: overMatchedMatchMatchMessages,
      });
    });

    const notMachedParticipants = matchMatchMessages.filter(
      (matchMatchMessage) =>
        !matchedSubmissionArr.includes([
          ...matchMatchMessage.submission.toUpperCase(),
          ...overMatchedSubmissionArr.submission.toUpperCase(),
        ]),
    );

    const matchingUsersIdArr = matchedDescriptionArr.reduce((pre, cur) => {
      cur.items.forEach((item) => {
        pre.push(item.id);
      });
      return pre;
    }, []);

    const bulkWriteArr = matchingUsersIdArr.map((id) => ({
      updateOne: {
        filter: { id },
        update: { $inc: { matchMatch: 20 } },
        upsert: true,
      },
    }));

    Point.bulkWrite(bulkWriteArr);

    const description = `# Topic: ${matchMatchTopic.topic}\n${
      matchedDescriptionArr.length > 0
        ? `### Matching Users\n${matchedDescriptionArr
            .map(
              (e) =>
                `**${e.submission}**\n${e.items
                  .map(
                    (item) =>
                      `${userMention(item.id)} - ${item.submission} (${
                        item.submissionInTargetLanguage
                      })`,
                  )
                  .join('\n')}`,
            )
            .join('\n\n')}\n\n**All matching users get 20 points each.**`
        : '### There are no matching users.'
    }\n${
      notMachedParticipants.length > 0
        ? `### No matches\n${notMachedParticipants
            .map(
              (item) =>
                `${userMention(item.id)} - ${item.submission} (${item.submissionInTargetLanguage})`,
            )
            .join('\n')}`
        : '### There are no unmatched users.'
    }\n${
      overMatchedDescriptionArr.length > 0
        ? `### Matches with More Than 2\n${overMatchedDescriptionArr
            .map(
              (e) =>
                `**${e.submission}**\n${e.items
                  .map(
                    (item) =>
                      `${userMention(item.id)} - ${item.submission} (${
                        item.submissionInTargetLanguage
                      })`,
                  )
                  .join('\n')}`,
            )
            .join('\n\n')}\n\n`
        : '### There are no over matching users.'
    }`;

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description,
        },
      ],
    });

    await MatchMatchMessage.deleteMany();
    await MatchMatchTopic.deleteOne({ _id: matchMatchTopic._id });

    const stickyMessageTitle = 'Match-match';
    const currentMessges = await channel.messages.fetch(20);
    const stickyMessages = currentMessges.filter(
      (currentMessage) =>
        currentMessage?.author?.id === config.CLIENT_ID &&
        currentMessage?.embeds[0]?.title === stickyMessageTitle,
    );

    await Promise.all(
      stickyMessages.map((stickyMessage) => stickyMessage.delete().catch(() => {})),
    );

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
