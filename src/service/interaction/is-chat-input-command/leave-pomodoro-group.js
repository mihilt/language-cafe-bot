import { userMention } from 'discord.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';
import { finishedPomodoro } from './create-pomodoro-group.js';
import client from '../../../client/index.js';

export default async (interaction) => {
  try {
    await interaction.deferReply({
      ephemeral: true,
    });

    const pomodoroGroupRes = await PomodoroGroup.find();

    const pomodoroGroup = pomodoroGroupRes.find((group) =>
      group.members.includes(interaction.user.id),
    );

    if (!pomodoroGroup) {
      await interaction.editReply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'You are not in a pomodoro group.',
          },
        ],
        ephemeral: true,
      });

      return;
    }

    const pomodoroGroupFindOneAndUpdateRes = await PomodoroGroup.findOneAndUpdate(
      { name: pomodoroGroup.name },
      { $pull: { members: interaction.user.id } },
      { new: true },
    );

    if (!pomodoroGroupFindOneAndUpdateRes) {
      await interaction.editReply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'Failed to leave the pomodoro group.',
          },
        ],
        ephemeral: true,
      });

      return;
    }

    await interaction.deleteReply();

    await interaction.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: `${userMention(interaction.user.id)} left the pomodoro group \`${
            pomodoroGroup.name
          }\`.`,
        },
      ],
    });

    if (pomodoroGroupFindOneAndUpdateRes.members.length === 0) {
      const channel = await client.channels.fetch(pomodoroGroup.channelId);

      finishedPomodoro({
        groupName: pomodoroGroup.name,
        channel,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
