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
    }));

    const currentTimestamp = Date.now();

    // reset streak if expiredTimestamp is less than currentTimestamp
    const expiredUserList = userList.filter(
      (user) => userObject[user.id].expiredTimestamp < currentTimestamp,
    );

    expiredUserList.forEach((user) => {
      userObject[user.id].point = 0;
    });

    // eslint-disable-next-line no-unused-expressions
    expiredUserList.length && (await studyCheckInKeyv.set('user', userObject));

    const filteredUserList = userList.filter((user) => !expiredUserList.includes(user));

    const rankedUserList = filteredUserList
      .sort(
        (a, b) =>
          Number(b.point) - Number(a.point) ||
          Number(b.lastAttendanceTimestamp) - Number(a.lastAttendanceTimestamp),
      )
      .slice(0, 10);

    const currentUser = filteredUserList.find((user) => user.id === interaction.user.id);

    let content = rankedUserList
      .map(
        (user, index) =>
          `${bold(index + 1)}. ${userMention(user.id)} (Streak: ${bold(
            user.point,
          )}, Last check in: ${time(+user.lastAttendanceTimestamp.toString().slice(0, 10), 'R')})`,
      )
      .join('\n');

    if (content) content = `## Current Study-Check-In Leaderboard (Top 10)\n\n${content}`;

    if (currentUser) {
      content += `\n\n${userMention(currentUser.id)}, you are rank #${bold(
        filteredUserList.indexOf(currentUser) + 1,
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
