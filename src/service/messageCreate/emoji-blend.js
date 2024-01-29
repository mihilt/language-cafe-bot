import { Chance } from 'chance';
import config from '../../config/index.js';
import emojiList from '../../data/random-emojis.js';
import EmojiBlend from '../../models/emoji-blend.js';

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
    const lastBotMessage = messages.find((msg) => msg.author.id === clientId);

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

    const lastBotMessageContentArray = lastBotMessageContent.split('');
    const isMessageIncludesEmoji = lastBotMessageContentArray.every((emoji) =>
      currentMessageContent.includes(emoji),
    );

    if (isMessageIncludesEmoji) {
      await message.react('✅').catch(() => {});

      const messageAuthorId = message.author.id;

      const point = Math.floor(
        lastBotMessageContent.length / 2 + currentMessageContent.length / 30,
      );

      const findOneRes = await EmojiBlend.findOne({ id: messageAuthorId });

      if (!findOneRes) {
        const emojiBlend = new EmojiBlend({
          id: messageAuthorId,
          point,
        });
        await emojiBlend.save();
      } else {
        await EmojiBlend.updateOne({ id: messageAuthorId }, { $inc: { point } });
      }

      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            footer: {
              icon_url: message.author.avatarURL(),
              text: `${message.author.username}#${
                message.author.discriminator
              }, Earned ${point} point(s), Total point is now ${(
                (findOneRes?.point || 0) + point
              ).toLocaleString()} point(s).`,
            },
          },
        ],
      });

      sendNextEmojis();
    }
  } catch (error) {
    console.error(error);
  }
};
