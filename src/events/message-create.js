import { Events } from 'discord.js';
import studyCheckIn from '../service/messageCreate/study-check-in.js';
import suggestionBoxMessageCreate from '../service/messageCreate/suggestion-box.js';
import passTheCoffeeCup from '../service/messageCreate/pass-the-coffee-cup.js';
import passTheEmoji from '../service/messageCreate/emoji-blend.js';
import config from '../config/index.js';

const {
  SUGGESTION_BOX_CHANNEL_ID: suggestionBoxChannelId,
  PASS_THE_COFFEE_CUP_CHANNEL_ID: passTheCoffeeCupChannelId,
  EMOJI_BLEND_CHANNEL_ID: emojiBlendChannelId,
  STUDY_CHECK_IN_CHANNEL_ID: studyCheckInChannelId,
} = config;

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // #study-check-in
    if (message.channel.id === studyCheckInChannelId && message.content.startsWith('!lc-streak')) {
      studyCheckIn(message);
    }

    // #suggention-box
    if (message.channel.id === suggestionBoxChannelId) {
      suggestionBoxMessageCreate(message);
    }

    // ⁠#pass-the-coffee-cup
    if (message.channel.id === passTheCoffeeCupChannelId) {
      passTheCoffeeCup(message);
    }

    // #emoji-blend
    if (message.channel.id === emojiBlendChannelId) {
      passTheEmoji(message);
    }
  },
};
