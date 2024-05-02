import { SlashCommandBuilder } from 'discord.js';
import createNewCategory from '../../service/interaction/is-chat-input-command/create-new-category.js';

export default {
  data: new SlashCommandBuilder()
    .setName('create-new-category')
    .setDescription('Create new category'),

  async execute(interaction) {
    createNewCategory(interaction);
  },
};
