import { userMention } from 'discord.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export default async (interaction) => {
  try {
    await interaction.deferUpdate();
    await interaction.deleteReply();

    const groupName = interaction.customId.split(':')[1];

    const pomodoroGroupFindOneAndUpdateRes = await PomodoroGroup.findOneAndUpdate(
      { name: groupName },
      { $push: { members: interaction.user.id } },
    );

    if (!pomodoroGroupFindOneAndUpdateRes) {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'Failed to join the pomodoro group.',
          },
        ],
        ephemeral: true,
      });

      return;
    }

    await interaction.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: `${userMention(
            interaction.user.id,
          )} joined the pomodoro group \`${groupName}\`.`,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
