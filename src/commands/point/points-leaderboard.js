import { SlashCommandBuilder } from 'discord.js';
import pointsLeaderboard from '../../service/interaction/is-chat-input-command/points-leaderboard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('points-leaderboard')
    .setDescription('Show point leaderboard'),

  async execute(interaction) {
    pointsLeaderboard(interaction);
  },
};
