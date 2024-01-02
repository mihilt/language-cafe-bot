import { bold, time, userMention } from 'discord.js';
import { studyCheckInKeyv } from '../../db/keyvInstances.js';
import channelLog, { generateMessageCreateLogContent } from '../utils/channel-log.js';

export default async (message) => {
  const users = await studyCheckInKeyv.get('user');
  const user = users[message.author.id];

  const currentDate = new Date();
  const nextDayTemp = new Date(currentDate);
  nextDayTemp.setDate(currentDate.getDate() + 1);
  nextDayTemp.setHours(23, 59, 59, 0);
  const nextDay = new Date(nextDayTemp);

  const expiredTimestamp = nextDay.getTime();
  const currentTimestamp = currentDate.getTime();

  // check if user.lastAttendanceTimestamp and currentTimestamp is in the same day
  const lastAttendanceDay = user?.lastAttendanceTimestamp
    ? new Date(user?.lastAttendanceTimestamp)?.toISOString().split('T')[0]
    : null;
  const currentDay = currentDate?.toISOString().split('T')[0];

  const isSameDay = lastAttendanceDay === currentDay;

  channelLog(
    generateMessageCreateLogContent(
      message,
      `command: \`!lc-streak\`\n\nlastAttendanceDay: ${lastAttendanceDay}\ncurrentDay: ${currentDay}\nisSameDay: ${isSameDay}`,
    ),
  );

  const ableToAttendDate = new Date(currentDate);
  ableToAttendDate.setDate(currentDate.getDate() + 1);
  ableToAttendDate.setHours(0, 0, 0, 0);
  const ableToAttendTimestamp = ableToAttendDate.getTime();

  if (isSameDay) {
    const embad = {
      color: 0x65a69e,
      title: 'Study Check In',
      description: `${userMention(
        message.author.id,
      )}, you have already logged your study session today.\nCome back after ${time(
        +ableToAttendTimestamp.toString().slice(0, 10),
        'F',
      )} to increase your streak!\n### This message will be deleted in 1 minute.`,
    };

    const replyMessage = await message.reply({ embeds: [embad] });
    setTimeout(() => {
      replyMessage.delete();
    }, 1000 * 60);

    return;
  }

  let freezePoint = user?.freezePoint ?? 0;

  if (user?.expiredTimestamp < currentTimestamp) {
    const differenceDays = Math.ceil(
      (currentTimestamp - user.expiredTimestamp) / (1000 * 60 * 60 * 24),
    );

    freezePoint -= differenceDays;

    if (freezePoint < 0) {
      freezePoint = 0;
      user.point = 0;
    }
  }

  let point = user?.point ?? 0;
  point += 1;

  const highestPoint = (user?.highestPoint ?? 0) > point ? user?.highestPoint : point;

  const isPointMultipleOf7 = point % 7 === 0;

  if (isPointMultipleOf7) {
    freezePoint = freezePoint < 3 ? freezePoint + 1 : freezePoint;
  }

  await studyCheckInKeyv.set('user', {
    ...users,
    [message.author.id]: {
      point,
      lastAttendanceTimestamp: currentTimestamp,
      expiredTimestamp,
      highestPoint,
      freezePoint,
    },
  });

  if (point % 30 === 0 || point % 100 === 0) {
    const proverbs = [
      'Success is the sum of small efforts, repeated day in and day out.',
      "Rome wasn't built in a day, but they were laying bricks every hour.",
      'Slow and steady wins the race.',
      'Little strokes fell great oaks',
      'Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill',
      'It does not matter how slowly you go as long as you do not stop. - Confucius',
      'The journey of a thousand miles begins with one step. - Lao Tzu',
      'Perseverance is not a long race; it is many short races one after the other. - Walter Elliot',
      'Success is the sum of small efforts, repeated day in and day out. - Robert Collier',
      'Patience, persistence, and perspiration make an unbeatable combination for success. - Napoleon Hill',
      'Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing or learning to do. - Pelé',
    ];

    message.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: `${userMention(message.author.id)} has just reached a streak of ${bold(
            point,
          )}. Good job!\n\n*${
            proverbs[Math.floor(Math.random() * proverbs.length)]
          }*\n\nKeep it up!`,
          thumbnail: {
            url: message.author.avatarURL(),
          },
        },
      ],
    });
  }

  const additionalEmbeds = [];

  if (point === 1 && user?.lastAttendanceTimestamp) {
    const additionalContent = `${userMention(
      message.author.id,
    )}, your streak was reset to 0 due to missing one or more days previously.\nYour streak has been updated to ${bold(
      1,
    )} after logging today's session.\n\nYour last study session was logged on ${time(
      +user.lastAttendanceTimestamp.toString().slice(0, 10),
      'F',
    )}.\n### This message will be deleted in 1 minute.`;

    const additionalEmbed = {
      color: 0x65a69e,
      title: 'Your streak has been reset',
      description: additionalContent,
    };

    additionalEmbeds.push(additionalEmbed);
  }

  let content = `${userMention(
    message.author.id,
  )}, you studied for ${point} day(s) in a row!\nStudy streak increased to ${bold(
    point,
  )} 🔥\n\nCome back after ${time(
    +ableToAttendTimestamp.toString().slice(0, 10),
    'F',
  )} to increase your streak!\nStreak expires on ${time(
    +new Date(expiredTimestamp).getTime().toString().slice(0, 10),
    'F',
  )}.\n`;

  const additionalContent = `\n${bold('Streak Freezes')}\nYou currently have ${bold(
    freezePoint,
  )} streak freezes 🧊\n\nA streak freeze will be used automatically if you miss logging your studies for a day.`;

  content += additionalContent;

  content += '\n### This message will be deleted in 1 minute.';

  const embed = {
    color: 0x65a69e,
    title: 'Study Check In',
    description: content,
  };

  message.react('🔥');

  const replyMessage = await message.reply({ embeds: [embed, ...additionalEmbeds] });
  setTimeout(() => {
    replyMessage.delete();
  }, 1000 * 60);
};
