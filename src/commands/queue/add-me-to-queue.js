import { SlashCommandBuilder } from 'discord.js';
import addMeToQueue from '../../service/interaction/is-chat-input-command/add-me-to-queue.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('add-me-to-queue')
    .setDescription('Add yourself to the queue.'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));
    addMeToQueue(interaction);
  },
};
