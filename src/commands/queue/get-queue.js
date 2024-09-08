import { SlashCommandBuilder } from 'discord.js';
import getQueue from '../../service/interaction/is-chat-input-command/get-queue.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder().setName('get-queue').setDescription('Add yourself to the queue.'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));
    getQueue(interaction);
  },
};
