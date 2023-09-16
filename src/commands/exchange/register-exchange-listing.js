import { SlashCommandBuilder } from 'discord.js';
import registerExchangePartnerList from '../../service/interaction/is-chat-input-command/register-exchange-listing.js';

export default {
  data: new SlashCommandBuilder()
    .setName('register-exchange-listing')
    .setDescription('Register exchange partner list'),

  async execute(interaction) {
    registerExchangePartnerList(interaction);
  },
};
