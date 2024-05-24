import { SlashCommandBuilder } from 'discord.js';
import participateMatchMatch from '../../service/interaction/is-chat-input-command/participate-match-match.js';

export default {
  data: new SlashCommandBuilder()
    .setName('match-match')
    .setDescription('Participate in a match-match'),
  async execute(interaction) {
    participateMatchMatch(interaction);
  },
};
