import { Events } from 'discord.js';
import suggestionBoxMessageCreate from '../service/messageCreate/suggestion-box.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // if channel is #suggention-box, create a thread and react
    if (message.channel.id === '739915251864043640') {
      suggestionBoxMessageCreate(message);
    }
  },
};
