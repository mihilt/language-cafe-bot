import { SlashCommandBuilder, bold } from 'discord.js';
import keyv from '../../db/keyv.js';

export default {
  data: new SlashCommandBuilder()
    .setName('study-check-in')
    .setDescription("Check in to #study-check-in's streak leaderboard."),
  async execute(interaction) {
    const users = await keyv.get('user');
    const user = users[interaction.user.id];

    const currentDate = new Date();
    const nextDayTemp = new Date(currentDate);
    nextDayTemp.setDate(currentDate.getDate() + 1);
    nextDayTemp.setHours(23, 59, 59, 0);
    const nextDay = new Date(nextDayTemp);

    const expiredTimestamp = nextDay.getTime();
    const currentTimestamp = currentDate.getTime();

    // check if user.lastAttendanceTimestamp and currentTimestamp is in the same day
    if (new Date(user?.lastAttendanceTimestamp).getDate() === currentDate.getDate()) {
      const ableToAttendDate = new Date(currentDate);
      ableToAttendDate.setDate(currentDate.getDate() + 1);
      ableToAttendDate.setHours(0, 0, 0, 0);
      const ableToAttendTimestamp = ableToAttendDate.getTime();

      const embad = {
        color: 0x65a69e,
        title: 'Study Check In',
        description: `<@${
          interaction.user.id
        }>, you have already logged your study session today.\nCome back <t:${ableToAttendTimestamp
          .toString()
          .slice(0, 10)}:R> to increase your streak!`,
      };

      await interaction.reply({ embeds: [embad], ephemeral: true });
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
      [interaction.user.id]: {
        point,
        lastAttendanceTimestamp: currentTimestamp,
        expiredTimestamp,
      },
    });

    const content = `<@${
      interaction.user.id
    }>, you studied for ${point} day(s) in a row!\nStudy streak increased to ${bold(
      point,
    )} 🔥\n\nCome back tomorrow to increase your streak!\nStreak expires <t:${new Date(
      expiredTimestamp,
    )
      .getTime()
      .toString()
      .slice(0, 10)}:R>`;

    const embed = {
      color: 0x65a69e,
      title: 'Study Check In',
      description: content,
    };

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // put message if your streak expired
    if (point === 1 && user?.lastAttendanceTimestamp) {
      const additionalContent = `<@${
        interaction.user.id
      }>, your streak was reset to 0 due to missing one or more days previously.\nYour streak has been updated to ${bold(
        1,
      )} after logging today's session.\n\nYour last study session was logged <t:${user.lastAttendanceTimestamp
        .toString()
        .slice(0, 10)}:R>.`;

      const additionalEmbed = {
        color: 0x65a69e,
        title: 'Study Check In',
        description: additionalContent,
      };

      await interaction.reply({ embeds: [additionalEmbed], ephemeral: true });
    }
  },
};
