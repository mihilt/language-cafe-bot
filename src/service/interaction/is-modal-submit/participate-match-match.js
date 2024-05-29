import config from '../../../config/index.js';
import MatchMatchMessage from '../../../models/match-match-message.js';
import MatchMatchTopic from '../../../models/match-match-topic.js';

const { CLIENT_ID: clientId, MATCH_MATCH_COMMAND_ID: matchMatchCommandId } = config;

export default async (interaction) => {
  try {
    const currentMatchMatchTopic = await MatchMatchTopic.findOne().sort({ createdAt: 1 });

    if (!currentMatchMatchTopic) {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            description:
              "There's no match-match topic left.\nPlease ping the moderator to create a new topic.",
          },
        ],
        ephemeral: true,
      });
      return;
    }

    const submissionInTargetLanguage = interaction.fields.getTextInputValue(
      'submissionInTargetLanguage',
    );
    const submission = interaction.fields.getTextInputValue('submission');

    const res = await MatchMatchMessage.findOneAndUpdate(
      {
        id: interaction.user.id,
      },
      {
        submissionInTargetLanguage,
        submission,
      },
      {
        upsert: true,
        new: true,
      },
    );

    if (res) {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            description: `Submission ${
              res.createdAt.toString() === res.updatedAt.toString() ? 'received' : '**updated**'
            } successfully\n\nSubmission In Target Language:\`\`\`\n${submissionInTargetLanguage}\n\`\`\`\nEnglish Translation of Submission:\`\`\`\n${submission}\n\`\`\``,
          },
        ],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'Failed to create category',
          },
        ],
        ephemeral: true,
      });

      return;
    }

    const stickyMessageTitle = 'Match-match';
    const currentMessges = await interaction.channel.messages.fetch(20);
    const stickyMessages = currentMessges.filter(
      (currentMessage) =>
        currentMessage?.author?.id === clientId &&
        currentMessage?.embeds[0]?.title === stickyMessageTitle,
    );

    await Promise.all(
      stickyMessages.map((stickyMessage) => stickyMessage.delete().catch(() => {})),
    );

    const numberOfSubmissions = await MatchMatchMessage.countDocuments();

    await interaction.channel.send({
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
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Failed to create category (Internal Server Error)',
        },
      ],
      ephemeral: true,
    });
  }
};
