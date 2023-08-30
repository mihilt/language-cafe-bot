import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('generate-poll').setDescription('Generate a poll'),

  // eslint-disable-next-line no-unused-vars, no-empty-function
  async execute(interaction) {
    console.log('generate-poll');
  },
};
