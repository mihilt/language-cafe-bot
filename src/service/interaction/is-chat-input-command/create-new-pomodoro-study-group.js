import schedule from 'node-schedule';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export default async (interaction) => {
  await interaction.deferReply();
  const groupName = interaction.options.getString('group-name');
  const timeOption = interaction.options.getString('time-option');

  const timeOptionArr = timeOption.split('/');

  if (!timeOptionArr.every((e) => !Number.isNaN(+e))) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Study time is not valid.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  // TODO: check if study time is not much high

  const calculatedtimeOption = timeOptionArr.reduce((pre, cur, index) => {
    pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
    return pre;
  }, []);

  if (!global.pomodoro) {
    global.pomodoro = {};
  }

  const pomodoroInstance = global.pomodoro;

  const pomodoroGroupInstance = pomodoroInstance[groupName];

  if (pomodoroGroupInstance) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: `A group with the name \`${groupName}\` already exists.`,
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const nowTimeStamp = Date.now();

  const res = await PomodoroGroup.create({
    name: groupName,
    timeOption: timeOptionArr,
    startTimeStamp: nowTimeStamp,
    members: [interaction.user.id],
  });

  if (!res) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Failed to create a new group.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  /**
   * i will initialize the pomodoro instance if database exists when the bot is started
   * i thought that if database time is already passed, then the pomodoro won't be created
   */

  await interaction.editReply({
    embeds: [
      {
        color: 0x65a69e,
        description: `A new pomodoro study group \`${groupName}\` has been created.\n\nThe study time is \`${timeOption}\`.`,
      },
    ],
  });

  await interaction.channel.send(
    `<@${interaction.user.id}>, it's time to **study**. (${timeOptionArr[0]} minutes).`,
  );

  const finishedPomodoro = async () => {
    delete pomodoroInstance[groupName];
    await PomodoroGroup.deleteOne({ name: groupName });
    await interaction.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: `The pomodoro study group \`${groupName}\` has been finished.`,
        },
      ],
    });
  };

  pomodoroInstance[groupName] = calculatedtimeOption.map((time, index) =>
    schedule.scheduleJob(new Date(nowTimeStamp + 1000 * 60 * time), async () => {
      // schedule.scheduleJob(new Date(nowTimeStamp + 1000 * time), async () => {
      const currentStatus = index % 2 === 0 ? 'break' : 'study';
      const pomodoroGroupRes = await PomodoroGroup.findOne({ name: groupName });
      const users = pomodoroGroupRes.members;

      await interaction.channel.send(
        `<@${users.join('>, <@')}>, it's time to **${currentStatus}**.${
          timeOptionArr[index + 1] ? ` (${timeOptionArr[index + 1]} minutes).` : ''
        }`,
      );

      if (index === calculatedtimeOption.length - 1) {
        finishedPomodoro();
      }
    }),
  );
};
