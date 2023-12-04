import { Chance } from 'chance';
import emojiList from '../../data/random-emojis.js';

const generateRandomThreeUniqueEmoji = () => {
  const emojiSet = new Set();
  const oneToThree = Chance().weighted([1, 2, 3], [10, 20, 70]);

  while (emojiSet.size < oneToThree) {
    const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    emojiSet.add(randomEmoji);
  }
  return [...emojiSet].join('');
};

export default async (message) => {
  const messages = await message.channel.messages.fetch({ limit: 10 });
  const lastBotMessage = messages.find((msg) => msg.author.bot);
  const sendMessage = () => {
    message.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: generateRandomThreeUniqueEmoji(),
        },
      ],
    });
  };

  if (!lastBotMessage || messages.last() === lastBotMessage) {
    await message.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description:
            'Please send a proper message that includes the emojis to continue the game.',
        },
      ],
    });

    sendMessage();
    return;
  }

  const lastBotMessageContent = lastBotMessage.embeds[0].description;
  const currentMessageContent = message.content;

  const lastBotMessageContentArray = lastBotMessageContent.split('');
  const isMessageIncludesEmoji = lastBotMessageContentArray.every((emoji) =>
    currentMessageContent.includes(emoji),
  );

  if (isMessageIncludesEmoji) {
    await message.react('✅');
    sendMessage();
  }
};
