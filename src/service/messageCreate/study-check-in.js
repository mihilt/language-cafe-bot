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
  const lastAttendanceDay = new Date(user?.lastAttendanceTimestamp).getDate();
  const currentDay = currentDate.getDate();
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
    }, 60000);

    return;
  }

  // check if user.expiredTimestamp is less than currentTimestamp reset streak
  if (user?.expiredTimestamp < currentTimestamp) {
    user.point = 0;
  }

  let point = user?.point ?? 0;
  point += 1;

  await studyCheckInKeyv.set('user', {
    ...users,
    [message.author.id]: {
      point,
      lastAttendanceTimestamp: currentTimestamp,
      expiredTimestamp,
    },
  });

  if (point % 10 === 0) {
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

  const content = `${userMention(
    message.author.id,
  )}, you studied for ${point} day(s) in a row!\nStudy streak increased to ${bold(
    point,
  )} 🔥\n\nCome back after ${time(
    +ableToAttendTimestamp.toString().slice(0, 10),
    'F',
  )} to increase your streak!\nStreak expires on ${time(
    +new Date(expiredTimestamp).getTime().toString().slice(0, 10),
    'F',
  )}.\n### This message will be deleted in 1 minute.`;

  const embed = {
    color: 0x65a69e,
    title: 'Study Check In',
    description: content,
  };

  message.react('🔥');

  const replyMessage = await message.reply({ embeds: [embed] });
  setTimeout(() => {
    replyMessage.delete();
  }, 60000);

  // put message if your streak expired
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
      title: 'Study Check In',
      description: additionalContent,
    };

    const additionalReplyMessage = await message.reply({ embeds: [additionalEmbed] });
    setTimeout(() => {
      additionalReplyMessage.delete();
    }, 60000);
  }
};
