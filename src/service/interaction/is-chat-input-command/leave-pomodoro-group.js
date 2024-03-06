import { userMention } from 'discord.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

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
      await interaction.reply({
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
      await interaction.reply({
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

    if (pomodoroGroupFindOneAndUpdateRes.members.length === 0) {
      // TODO: if members is empty, delete the group from the database and also schedule instance
    }

    await interaction.deleteReply();

    await interaction.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: `${userMention(interaction.user.id)} left the pomodoro group. \`${
            pomodoroGroup.name
          }\`.`,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
