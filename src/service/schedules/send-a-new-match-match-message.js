import { userMention } from 'discord.js';
import client from '../../client/index.js';
import config from '../../config/index.js';
import MatchMatchMessage from '../../models/match-match-message.js';
import MatchMatchTopic from '../../models/match-match-topic.js';

const { MATCH_MATCH_CHANNEL_ID: matchMatchChannelId } = config;

const sendANewMatchMatchMessage = async () => {
  try {
    const channel = await client.channels.fetch(matchMatchChannelId);
    const matchMatchMessages = await MatchMatchMessage.find();

    if (matchMatchMessages.length === 0) {
      await channel.send({
        embeds: [
          {
            color: 0x65a69e,
            description: 'There are no users participating in the match-match topic.',
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
      submissionWithCountObj[matchMatchMessage.submission] =
        submissionWithCountObj[matchMatchMessage.submission] + 1 || 1;
    });

    const filteredSubmissionArr = Object.keys(submissionWithCountObj)
      .reduce((pre, cur) => {
        if (submissionWithCountObj[cur] === 2) {
          pre.push(cur);
        }
        return pre;
      }, [])
      .sort((a, b) => a - b);

    const filteredDescriptionArr = [];

    filteredSubmissionArr.forEach((submission) => {
      const filteredMatchMatchMessages = matchMatchMessages.filter(
        (matchMatchMessage) => matchMatchMessage.submission === submission,
      );

      filteredDescriptionArr.push({
        submission,
        items: filteredMatchMatchMessages,
      });
    });

    const otherParticipants = matchMatchMessages.filter(
      (matchMatchMessage) => !filteredSubmissionArr.includes(matchMatchMessage.submission),
    );

    const description = `# Topic: ${matchMatchTopic.topic}\n${filteredDescriptionArr
      .map(
        (e) =>
          `### Submission: ${e.submission}\n\n${e.items
            .map((item) => `${userMention(item.id)} - ||${item.submissionInTargetLanguage}||`)
            .join('\n')}`,
      )
      .join('\n')}\n\n**Those matched users get 1 point each.**${
      filteredDescriptionArr.length === 0 && 'There are no matched users.'
    }\n\n### Other Participants: ${otherParticipants
      .map((item) => userMention(item.id))
      .join(', ')}`;

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
          description: `\`${numberOfSubmissions}\` users are participating.\n\nTopic\n\`\`\`\n${currentMatchMatchTopic.topic}\n\`\`\``,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export default sendANewMatchMatchMessage;
