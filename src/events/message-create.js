import { Events } from 'discord.js';
import studyCheckIn from '../service/messageCreate/study-check-in.js';
import suggestionBoxMessageCreate from '../service/messageCreate/suggestion-box.js';
import passTheCoffeeCup from '../service/messageCreate/pass-the-coffee-cup.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // #suggention-box
    if (message.channel.id === '739915251864043640') {
      suggestionBoxMessageCreate(message);
    }

    // ⁠#pass-the-coffee-cup
    if (message.channel.id === '1160816895633657856') {
      passTheCoffeeCup(message);
    }

    if (message.content.startsWith('!lc-streak')) {
      studyCheckIn(message);
    }
  },
};
