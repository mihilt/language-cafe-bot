import { SlashCommandBuilder, bold } from 'discord.js';
import keyv from '../../db/keyv.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Check the leaderboard'),
  async execute(interaction) {
    const userObject = await keyv.get('user');
    const propertyNames = Object.keys(userObject);

    const userList = propertyNames.map((key) => ({
      id: key,
      point: userObject[key].point,
      lastAttendanceTimestamp: userObject[key].lastAttendanceTimestamp,
      expiredTimestamp: userObject[key].expiredTimestamp,
    }));

    const currentTimestamp = Date.now();
    const expiredUserList = userList.filter(
      (user) => userObject[user.id].expiredTimestamp < currentTimestamp,
    );

    expiredUserList.forEach((user) => {
      delete userObject[user.id];
    });

    await keyv.set('user', userObject);

    const filteredUserList = userList.filter((user) => !expiredUserList.includes(user));

    const rankedUserList = filteredUserList.sort((a, b) => b.point - a.point).slice(0, 10);

    const currentUser = filteredUserList.find((user) => user.id === interaction.user.id);

    let content = rankedUserList
      .map(
        (user, index) =>
          `${bold(index + 1)}. <@${user.id}> (Streak: ${bold(
            user.point,
          )}, Last attendance: <t:${user.lastAttendanceTimestamp.toString().slice(0, 10)}:R>)`,
      )
      .join('\n');

    if (content) content = `# Study Leaderboard (Top 10)\n\n${content}`;

    if (currentUser) {
      content += `\n\nYour rank is #${bold(filteredUserList.indexOf(currentUser) + 1)} with ${bold(
        currentUser.point,
      )} streak`;
    }

    if (!content) content = 'No one has logged their study session yet';

    await interaction.reply({ content, ephemeral: true });
  },
};
