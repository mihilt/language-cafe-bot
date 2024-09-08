import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import resetQueue from '../../service/interaction/is-chat-input-command/reset-queue.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reset-queue')
    .setDescription('Reset the queue.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));
    resetQueue(interaction);
  },
};
