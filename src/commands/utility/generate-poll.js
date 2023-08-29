import { SlashCommandBuilder } from 'discord.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName('generate-poll').setDescription('Generate a poll'),

  // eslint-disable-next-line no-unused-vars, no-empty-function
  async execute(interaction) {
    console.log('generate-poll');
  },
};
