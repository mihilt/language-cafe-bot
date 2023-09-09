import { SlashCommandBuilder } from 'discord.js';
import GeneratePollChatInputCommand from '../../service/interaction/is-chat-input-command/generate-poll.js';

export default {
  data: new SlashCommandBuilder().setName('generate-poll').setDescription('Generate a poll'),

  // eslint-disable-next-line no-unused-vars, no-empty-function
  async execute(interaction) {
    GeneratePollChatInputCommand(interaction);
  },
};
