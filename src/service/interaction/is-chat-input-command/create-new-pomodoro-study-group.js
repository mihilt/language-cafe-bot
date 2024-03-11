import { userMention } from 'discord.js';
import schedule from 'node-schedule';
import client from '../../../client/index.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export const finishedPomodoro = async ({ groupName, channel }) => {
  global?.pomodoro[groupName]?.forEach((job) => {
    job.cancel();
  });
  delete global?.pomodoro[groupName];
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

  const calculatedTimeOption = timeOption.reduce((pre, cur, index) => {
    pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
    return pre;
  }, []);

  pomodoroInstance[groupName] = calculatedTimeOption
    .map((time, index) => {
      if (startTimeStamp + 1000 * 60 * time < Date.now()) {
        return null;
      }

      return schedule.scheduleJob(new Date(startTimeStamp + 1000 * 60 * time), async () => {
        const currentStatus = index % 2 === 0 ? 'break' : 'study';
        const previousStatus = index % 2 === 0 ? 'study' : 'break';
        const pomodoroGroupRes = await PomodoroGroup.findOne({ name: groupName });
        const users = pomodoroGroupRes.members;

        if (users.length === 0) {
          await channel.send({
            embeds: [
              {
                color: 0x65a69e,
                description: `There is no one in the pomodoro study group \`${groupName}\`.`,
              },
            ],
          });
          return;
        }

        if (index !== calculatedTimeOption.length - 1) {
          await channel.send(
            `<@${users.join('>, <@')}>, It's time for **${currentStatus}**.${` (${
              calculatedTimeOption[index + 1] - time
            } minutes).`}`,
          );
          await channel.send({
            embeds: [
              {
                color: 0x65a69e,
                description: `### ${groupName}\n\n${calculatedTimeOption
                  .map(
                    (e, i) =>
                      `${i % 2 === 0 ? 'Study' : 'Break'}: \`${timeOption[i]} min\`${
                        i === index + 1 ? ' ←' : ''
                      }${
                        i > index + 1
                          ? ` (<t:${
                              Math.floor(startTimeStamp / 1000) + (e - timeOption[i]) * 60
                            }:R>)`
                          : ''
                      }`,
                  )
                  .join('\n')}`,
              },
            ],
          });
        } else {
          await channel.send(`<@${users.join('>, <@')}>, **${previousStatus}** time is over.`);
        }

        if (index === calculatedTimeOption.length - 1) {
          finishedPomodoro({
            groupName,
            channel,
          });
        }
      });
    })
    .filter((e) => e);

  if (pomodoroInstance[groupName].length === 0) {
    finishedPomodoro({
      groupName,
      channel,
    });
  }
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

  if (timeOptionArr.some((e) => +e > 100 || +e < 1)) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Each time option should be more than 1 minute and less than 100 minutes.',
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
    `<@${interaction.user.id}>, It's time for **study**. (${timeOptionArr[0]} minutes).`,
  );

  const calculatedTimeOption = timeOptionArr.reduce((pre, cur, index) => {
    pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
    return pre;
  }, []);

  await interaction.channel.send({
    embeds: [
      {
        color: 0x65a69e,
        description: `### ${groupName}\n\n${timeOptionArr
          .map(
            (e, i) =>
              `${i % 2 === 0 ? 'Study' : 'Break'}: \`${e} min\`${i === 0 ? ' ←' : ''}${
                i > 0
                  ? ` (<t:${
                      Math.floor(nowTimeStamp / 1000) + (calculatedTimeOption[i] - e) * 60
                    }:R>)`
                  : ''
              }`,
          )
          .join('\n')}`,
      },
    ],
  });

  putPomodoroScheduleJob({
    groupName,
    timeOption: timeOptionArr,
    startTimeStamp: nowTimeStamp,
    channelId,
  });
};
