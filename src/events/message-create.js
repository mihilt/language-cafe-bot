import { Events } from 'discord.js';
import suggestionBoxMessageCreate from '../service/messageCreate/suggestion-box.js';
import studyCheckIn from '../service/messageCreate/study-check-in.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // if channel is #suggention-box, create a thread and react
    if (message.channel.id === '739915251864043640') {
      suggestionBoxMessageCreate(message);
    }

    if (message.content.startsWith('!lc-streak')) {
      studyCheckIn(message);
    }
  },
};
