import { bold } from 'discord.js';
import keyv from '../../db/keyv.js';
import channelLog, { generateMessageCreateLogContent } from '../../util/channel-log.js';

export default async (message) => {
  const users = await keyv.get('user');
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
      description: `<@${
        message.author.id
      }>, you have already logged your study session today.\nCome back after <t:${ableToAttendTimestamp
        .toString()
        .slice(0, 10)}:F> to increase your streak!\n### This message will be deleted in 1 minute.`,
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

  await keyv.set('user', {
    ...users,
    [message.author.id]: {
      point,
      lastAttendanceTimestamp: currentTimestamp,
      expiredTimestamp,
    },
  });

  const content = `<@${
    message.author.id
  }>, you studied for ${point} day(s) in a row!\nStudy streak increased to ${bold(
    point,
  )} 🔥\n\nCome back after <t:${ableToAttendTimestamp
    .toString()
    .slice(0, 10)}:F> to increase your streak!\nStreak expires on <t:${new Date(expiredTimestamp)
    .getTime()
    .toString()
    .slice(0, 10)}:F>\n### This message will be deleted in 1 minute.`;

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
    const additionalContent = `<@${
      message.author.id
    }>, your streak was reset to 0 due to missing one or more days previously.\nYour streak has been updated to ${bold(
      1,
    )} after logging today's session.\n\nYour last study session was logged on <t:${user.lastAttendanceTimestamp
      .toString()
      .slice(0, 10)}:F>.\n### This message will be deleted in 1 minute.`;

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
