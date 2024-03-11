import PomodoroGroup from '../../../models/pomodoro-group.js';

export default async (interaction) => {
  try {
    await interaction.deferReply({
      ephemeral: true,
    });

    const pomodoroGroupRes = await PomodoroGroup.find();

    if (pomodoroGroupRes.length === 0) {
      await interaction.editReply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'No pomodoro group is active.',
          },
        ],
        ephemeral: true,
      });

      return;
    }

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

    const { name: groupName, startTimeStamp, timeOption } = pomodoroGroup;

    const calculatedTimeOption = timeOption.reduce((pre, cur, index) => {
      pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
      return pre;
    }, []);

    const currentTimeIndex = calculatedTimeOption.findIndex(
      (e) => +e * 60 * 1000 > Date.now() - startTimeStamp,
    );

    const description = `### ${groupName}\n\n${calculatedTimeOption
      .map(
        (e, i) =>
          `${i % 2 === 0 ? 'Study' : 'Break'}: \`${timeOption[i]} min\`${
            i >= currentTimeIndex ? ` (<t:${Math.floor(startTimeStamp / 1000) + e * 60}:R>)` : ''
          }${
            i === (currentTimeIndex === -1 ? timeOption.length - 1 : currentTimeIndex) ? '  ←' : ''
          }`,
      )
      .join('\n')}`;

    const fields = [
      {
        name: 'Members',
        value: pomodoroGroup.members.map((member) => `<@${member}>`).join(', '),
      },
    ];

    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description,
          fields,
        },
      ],
      ephemeral: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
