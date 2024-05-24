import config from '../../../config/index.js';
import MatchMatchMessage from '../../../models/match-match-message.js';
import MatchMatchTopic from '../../../models/match-match-topic.js';

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
              res.createdAt.toString() === res.updatedAt.toString() ? 'participated' : '**updated**'
            } successfully\n\nSubmission In Target Language:\`\`\`\n${submissionInTargetLanguage}\n\`\`\`\nSubmission:\`\`\`\n${submission}\n\`\`\``,
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
        currentMessage?.author?.id === config.CLIENT_ID &&
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
          description: `\`${numberOfSubmissions}\` users are participating.\n\nTopic\n\`\`\`\n${currentMatchMatchTopic.topic}\n\`\`\``,
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
