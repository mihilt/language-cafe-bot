import { Events } from 'discord.js';
import studyCheckIn from '../service/messageCreate/study-check-in.js';
import suggestionBoxMessageCreate from '../service/messageCreate/suggestion-box.js';
import passTheCoffeeCup from '../service/messageCreate/pass-the-coffee-cup.js';
import passTheEmoji from '../service/messageCreate/pass-the-emoji.js';

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

    // TODO: need to change this name to channel name
    // #pass-the-emoji
    if (message.channel.id === '1179401680492691456') {
      passTheEmoji(message);
    }

    if (message.content.startsWith('!lc-streak')) {
      studyCheckIn(message);
    }
  },
};
