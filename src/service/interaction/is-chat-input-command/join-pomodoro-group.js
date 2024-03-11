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

  const groupsInformationEmbeds = pomodoroGroupRes.map((group) => {
    const { name: groupName, startTimeStamp, timeOption } = group;

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
            i === (currentTimeIndex === -1 ? timeOption.length - 1 : currentTimeIndex)
              ? ` (ends <t:${Math.floor(startTimeStamp / 1000) + e * 60}:R>)  ←`
              : ''
          }`,
      )
      .join('\n')}`;

    const fields = [
      {
        name: 'Members',
        value: group.members.map((member) => `<@${member}>`).join(', '),
      },
    ];

    return {
      color: 0x65a69e,
      description,
      fields,
    };
  });

  await interaction.editReply({
    embeds: [
      {
        color: 0x65a69e,
        description: '### Select a group to join.',
      },
      ...groupsInformationEmbeds,
    ],
    components: [
      {
        type: 1,
        components: pomodoroGroupRes.map((group) => ({
          type: 2,
          label: group.name,
          style: ButtonStyle.Secondary,
          custom_id: `join-pomodoro-group:${group.name}`,
          disabled: group.members.includes(interaction.user.id),
        })),
      },
    ],
    ephemeral: true,
  });
};
