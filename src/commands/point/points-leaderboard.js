import { SlashCommandBuilder } from 'discord.js';
import pointsLeaderboard from '../../service/interaction/is-chat-input-command/points-leaderboard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('word-games-point-leaderboard')
    .setDescription('Show the word games point leaderboard.'),

  async execute(interaction) {
    pointsLeaderboard(interaction);
  },
};
