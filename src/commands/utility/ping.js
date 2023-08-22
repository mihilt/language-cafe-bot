import { SlashCommandBuilder } from 'discord.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
  async execute(interaction) {
    // await interaction.reply('Pong!');
    await interaction.reply({ content: 'Secret Pong!', ephemeral: true });
  },
};
