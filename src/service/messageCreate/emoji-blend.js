import { Chance } from 'chance';
import config from '../../config/index.js';
import emojiList from '../../data/emojis.js';
import EmojiBlend from '../../models/emoji-blend.js';
import Point from '../../models/point.js';

const { CLIENT_ID: clientId } = config;

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
  try {
    const messages = await message.channel.messages.fetch({ limit: 10 });

    const lastBotMessage = messages.find(
      (msg) => msg.author.id === clientId && msg?.embeds[0]?.description?.length <= 9,
    );

    const sendNextEmojis = () => {
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

      sendNextEmojis();
      return;
    }

    const lastBotMessageContent = lastBotMessage.embeds[0].description;
    const currentMessageContent = message.content;

    const lastBotMessageContentArray = [...lastBotMessageContent];
    const currentMessageContentArray = [...currentMessageContent];
    const isMessageIncludesEmoji = lastBotMessageContentArray
      // filter 'U+fe0f'
      .filter((emoji) => emoji !== '️')
      .every((emoji) => currentMessageContentArray.includes(emoji));

    if (isMessageIncludesEmoji) {
      await message.react('✅').catch(() => {});

      const messageAuthorId = message.author.id;

      const point = Math.floor(
        lastBotMessageContent.length / 2 + currentMessageContentArray.length / 100,
      );

      const findOneRes = await EmojiBlend.findOne({ id: messageAuthorId });

      await EmojiBlend.updateOne({ id: messageAuthorId }, { $inc: { point } }, { upsert: true });
      await Point.updateOne(
        { id: messageAuthorId },
        { $inc: { emojiBlend: lastBotMessageContent.length * 5 } },
        { upsert: true },
      );

      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            footer: {
              icon_url: message.author.avatarURL(),
              text: `${message.author.globalName}(${message.author.username}#${
                message.author.discriminator
              }) earned ${point} point(s), Total is now ${(
                (findOneRes?.point || 0) + point
              ).toLocaleString()} point(s).`,
            },
          },
        ],
      });

      await message.channel.send('_ _');

      sendNextEmojis();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
