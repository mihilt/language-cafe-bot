import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import generatePollChatInputCommand from '../../service/interaction/is-chat-input-command/generate-poll.js';

export default {
  // only staff can use this command
  data: new SlashCommandBuilder()
    .setName('generate-poll')
    .setDescription('Generate a poll')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    generatePollChatInputCommand(interaction);
  },
};
