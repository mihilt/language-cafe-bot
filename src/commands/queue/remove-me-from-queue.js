import { SlashCommandBuilder } from 'discord.js';
import removeMeFromQueue from '../../service/interaction/is-chat-input-command/remove-me-from-queue.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remove-me-from-queue')
    .setDescription('Remove yourself from the queue.'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));
    removeMeFromQueue(interaction);
  },
};
