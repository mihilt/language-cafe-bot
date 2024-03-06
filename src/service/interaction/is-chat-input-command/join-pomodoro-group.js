import { ButtonStyle } from 'discord.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export default async (interaction) => {
  await interaction.deferReply({
    ephemeral: true,
  });

  const pomodoroGroupRes = await PomodoroGroup.find();

  if (pomodoroGroupRes.length === 0) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'There are no pomodoro groups to join.',
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const members = pomodoroGroupRes.map((group) => group.members).flat();

  if (members.includes(interaction.user.id)) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'You are already in a pomodoro group.',
        },
      ],
      ephemeral: true,
    });

    return;
  }

  await interaction.editReply({
    embeds: [
      {
        color: 0x65a69e,
        description: 'Select a group to join.',
      },
    ],
    components: [
      {
        type: 1,
        components: pomodoroGroupRes.map((group, i) => ({
          type: 2,
          label: `${i} - ${group.name}`,
          style: ButtonStyle.Secondary,
          custom_id: `join-pomodoro-group:${group.name}`,
          disabled: group.members.includes(interaction.user.id),
        })),
      },
    ],
    ephemeral: true,
  });
};
