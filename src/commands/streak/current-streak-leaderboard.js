import { SlashCommandBuilder, bold, time, userMention } from 'discord.js';
import { studyCheckInKeyv } from '../../db/keyvInstances.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('current-streak-leaderboard')
    .setDescription("Check #study-check-in's streak leaderboard."),
  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const userObject = await studyCheckInKeyv.get('user');
    const propertyNames = Object.keys(userObject);

    const havePointsPropertyNames = propertyNames.filter((key) => userObject[key].point > 0);

    const userList = havePointsPropertyNames.map((key) => ({
      id: key,
      point: userObject[key].point,
      lastAttendanceTimestamp: userObject[key].lastAttendanceTimestamp,
      expiredTimestamp: userObject[key].expiredTimestamp,
      freezePoint: userObject[key].freezePoint || 0,
    }));

    const currentTimestamp = Date.now();

    const calculatedUserList = userList
      .map((user) => {
        if (user.expiredTimestamp < currentTimestamp) {
          const differenceDays = Math.ceil(
            (currentTimestamp - user.expiredTimestamp) / (1000 * 60 * 60 * 24),
          );

          const freezePoint = user.freezePoint - differenceDays;

          if (freezePoint < 0) {
            return {
              ...user,
              point: 0,
              freezePoint: 0,
            };
          }
        }

        return user;
      })
      .filter((user) => user.point > 0);

    const rankedUserList = [...calculatedUserList].sort(
      (a, b) =>
        Number(b.point) - Number(a.point) ||
        Number(b.lastAttendanceTimestamp) - Number(a.lastAttendanceTimestamp),
    );

    const slicedRankedUserList = rankedUserList.slice(0, 10);

    let content = slicedRankedUserList
      .map(
        (user, index) =>
          `${bold(index + 1)}. ${userMention(user.id)} (Streak: ${bold(
            user.point,
          )}, Last check in: ${time(+user.lastAttendanceTimestamp.toString().slice(0, 10), 'R')})`,
      )
      .join('\n');

    if (content) content = `## Current Study-Check-In Leaderboard (Top 10)\n\n${content}`;

    const currentUser = calculatedUserList.find((user) => user.id === interaction.user.id);

    if (currentUser) {
      content += `\n\n${userMention(currentUser.id)}, you are rank #${bold(
        rankedUserList.indexOf(currentUser) + 1,
      )} with a ${bold(currentUser.point)} day streak.`;
    }

    if (!content) content = 'No one has an active streak yet.';

    const embed = {
      color: 0x65a69e,
      description: content,
    };

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
