import { SlashCommandBuilder } from 'discord.js';
import keyv from '../../db/keyv.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Check the leaderboard'),
  async execute(interaction) {
    const userObject = await keyv.get('user');
    const propertyNames = Object.keys(userObject);

    const userList = propertyNames.map((key) => {
      return {
        id: key,
        point: userObject[key].point,
        expiredTimestamp: userObject[key].expiredTimestamp,
      };
    });

    const currentTimestamp = Date.now();
    const expiredUserList = userList.filter((user) => {
      return userObject[user.id].expiredTimestamp < currentTimestamp;
    });

    expiredUserList.forEach((user) => {
      delete userObject[user.id];
    });

    await keyv.set('user', userObject);

    const filteredUserList = userList.filter((user) => {
      return !expiredUserList.includes(user);
    });

    const rankedUserList = filteredUserList
      .sort((a, b) => {
        return b.point - a.point;
      })
      .slice(0, 10);

    const currentUser = filteredUserList.find((user) => user.id === interaction.user.id);

    let content = rankedUserList
      .map((user, index) => {
        return `${index + 1}. <@${user.id}> (${user.point})`;
      })
      .join('\n');

    if (currentUser) {
      content += `\n\nYour rank is #${filteredUserList.indexOf(currentUser) + 1} with ${
        currentUser.point
      } points`;
    }

    if (!content) content = 'No one has points yet!';

    await interaction.reply({ content, ephemeral: true });
  },
};
