import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import shiftQueue from '../../service/interaction/is-chat-input-command/shift-queue.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shift-queue')
    .setDescription('Shift the queue.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));
    shiftQueue(interaction);
  },
};
