import { SlashCommandBuilder } from 'discord.js';
import registerExchangePartnerList from '../../service/interaction/is-chat-input-command/register-exchange-partner-list.js';

export default {
  data: new SlashCommandBuilder()
    .setName('register-exchange-partner-list')
    .setDescription('Register exchange partner list'),

  async execute(interaction) {
    registerExchangePartnerList(interaction);
  },
};
