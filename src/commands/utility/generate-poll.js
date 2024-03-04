import { SlashCommandBuilder } from 'discord.js';
import generatePollChatInputCommand from '../../service/interaction/is-chat-input-command/generate-poll.js';

export default {
  data: new SlashCommandBuilder().setName('generate-poll').setDescription('Generate a poll'),

  async execute(interaction) {
    generatePollChatInputCommand(interaction);
  },
};
