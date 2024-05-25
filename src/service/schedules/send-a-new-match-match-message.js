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

    const descriptionArr = [];

    filteredSubmissionArr.forEach((submission) => {
      const filteredMatchMatchMessages = matchMatchMessages.filter(
        (matchMatchMessage) => matchMatchMessage.submission === submission,
      );

      descriptionArr.push({
        submission,
        items: filteredMatchMatchMessages,
      });
    });

    const description = `${descriptionArr
      .map(
        (e) =>
          `### Submission: ${e.submission}\n\n${e.items
            .map(
              (item) =>
                `id: ${item.id}, submission: ${item.submission}, submissionInTargetLanguage: ${item.submissionInTargetLanguage}`,
            )
            .join('\n')}`,
      )
      .join('\n')}`;

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          title: `Topic: ${matchMatchTopic.topic}`,
          description,
        },
      ],
    });

    // TODO: delete all match-match messages and current match-match topic
    // await MatchMatchMessage.deleteMany();
    // await MatchMatchTopic.deleteOne({ _id: matchMatchTopic._id });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export default sendANewMatchMatchMessage;
