import { userMention } from 'discord.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export default async (interaction) => {
  try {
    await interaction.deferUpdate();
    await interaction.deleteReply();

    const pomodoroGroupRes = await PomodoroGroup.find();

    const pomodoroGroup = pomodoroGroupRes.find((group) =>
      group.members.includes(interaction.user.id),
    );

    if (pomodoroGroup) {
      await interaction.channel.send({
        embeds: [
          {
            color: 0xc3c3e5,
            description: 'You are already in a pomodoro group.',
          },
        ],
      });

      return;
    }

    const groupName = interaction.customId.split(':')[1];

    const pomodoroGroupFindOneAndUpdateRes = await PomodoroGroup.findOneAndUpdate(
      { name: groupName },
      { $push: { members: interaction.user.id } },
    );

    if (!pomodoroGroupFindOneAndUpdateRes) {
      await interaction.reply({
        embeds: [
          {
            color: 0xc3c3e5,
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
          color: 0xc3c3e5,
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
