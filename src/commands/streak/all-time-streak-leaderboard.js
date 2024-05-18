import { SlashCommandBuilder, bold, time, userMention } from 'discord.js';
import { studyCheckInKeyv } from '../../db/keyvInstances.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('all-time-streak-leaderboard')
    .setDescription("Check #study-check-in's highest streak leaderboard."),
  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const userObject = await studyCheckInKeyv.get('user');
    const propertyNames = Object.keys(userObject);

    const filteredUsers = propertyNames
      .filter((key) => userObject[key].highestPoint > 0)
      .filter((key) => interaction.guild.members.cache.has(key));

    const userList = filteredUsers.map((key) => ({
      id: key,
      lastAttendanceTimestamp: userObject[key].lastAttendanceTimestamp,
      expiredTimestamp: userObject[key].expiredTimestamp,
      highestPoint: userObject[key].highestPoint,
    }));

    const rankedUserList = [...userList].sort(
      (a, b) =>
        Number(b.highestPoint) - Number(a.highestPoint) ||
        Number(b.lastAttendanceTimestamp) - Number(a.lastAttendanceTimestamp),
    );

    const slicedRankedUserList = rankedUserList.slice(0, 10);

    let content = slicedRankedUserList
      .map(
        (user, index) =>
          `${bold(index + 1)}. ${userMention(user.id)} (Streak: ${bold(
            user.highestPoint,
          )}, Last check in: ${time(+user.lastAttendanceTimestamp.toString().slice(0, 10), 'R')})`,
      )
      .join('\n');

    if (content) content = `## All-time Study-Check-In Leaderboard (Top 10)\n\n${content}`;

    const currentUser = userList.find((user) => user.id === interaction.user.id);

    if (currentUser) {
      content += `\n\n${userMention(currentUser.id)}, you are rank #${bold(
        rankedUserList.indexOf(currentUser) + 1,
      )} with a ${bold(currentUser.highestPoint)} day streak.`;
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
