import { userMention } from 'discord.js';
import schedule from 'node-schedule';
import client from '../../../client/index.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export const putPomodoroScheduleJob = async ({
  groupName,
  timeOption,
  startTimeStamp,
  channelId,
}) => {
  if (!global.pomodoro) {
    global.pomodoro = {};
  }

  const pomodoroInstance = global.pomodoro;

  const channel = await client.channels.fetch(channelId);

  const finishedPomodoro = async () => {
    delete pomodoroInstance[groupName];
    await PomodoroGroup.deleteOne({ name: groupName });
    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: `The pomodoro study group \`${groupName}\` has been finished.`,
        },
      ],
    });
  };

  const calculatedtimeOption = timeOption.reduce((pre, cur, index) => {
    pre.push({ index, value: (index > 0 ? pre[index - 1].value : 0) + +cur });
    return pre;
  }, []);

  const filteredCalculatedtimeOption = calculatedtimeOption.filter(
    (time) => startTimeStamp + 1000 * 60 * time.value > Date.now(),
  );

  if (filteredCalculatedtimeOption.length === 0) {
    finishedPomodoro();
    return;
  }

  pomodoroInstance[groupName] = filteredCalculatedtimeOption.map((time, index) =>
    schedule.scheduleJob(new Date(startTimeStamp + 1000 * 60 * time.value), async () => {
      const currentStatus = time.index % 2 === 0 ? 'break' : 'study';
      const previousStatus = time.index % 2 === 0 ? 'study' : 'break';
      const pomodoroGroupRes = await PomodoroGroup.findOne({ name: groupName });
      const users = pomodoroGroupRes.members;

      if (index !== filteredCalculatedtimeOption.length - 1) {
        await channel.send(
          `<@${users.join('>, <@')}>, It's time to **${currentStatus}**.${` (${
            filteredCalculatedtimeOption[index + 1].value - time.value
          } minutes).`}`,
        );
      } else {
        await channel.send(`<@${users.join('>, <@')}>, **${previousStatus}** time is over.`);
      }

      if (index === filteredCalculatedtimeOption.length - 1) {
        finishedPomodoro();
      }
    }),
  );
};

export default async (interaction) => {
  await interaction.deferReply({
    ephemeral: true,
  });
  const channelId = interaction.channel.id;
  const groupName = interaction.options.getString('group-name');
  const timeOption = interaction.options.getString('time-option');

  const timeOptionArr = timeOption.split('/');

  if (!timeOptionArr.every((e) => !Number.isNaN(+e) && +e > 0)) {
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

  if (timeOptionArr.some((e) => +e > 100)) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Each time option should be less than 100 minutes.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  const pomodoroGroupRes = await PomodoroGroup.find();

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

  if (pomodoroGroupRes.some((group) => group.name === groupName)) {
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
    channelId,
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

  await interaction.deleteReply();

  await interaction.channel.send({
    embeds: [
      {
        color: 0x65a69e,
        description: `${userMention(
          interaction.user.id,
        )} created a new pomodoro study group \`${groupName}\`.\n\nThe study time is \`${timeOption}\`.`,
      },
    ],
  });

  await interaction.channel.send(
    `<@${interaction.user.id}>, It's time to **study**. (${timeOptionArr[0]} minutes).`,
  );

  putPomodoroScheduleJob({
    groupName,
    timeOption: timeOptionArr,
    startTimeStamp: nowTimeStamp,
    channelId,
  });
};
