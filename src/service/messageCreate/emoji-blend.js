import { Chance } from 'chance';
import { bold, userMention } from 'discord.js';
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
        lastBotMessageContent.length / 2 + currentMessageContent.length / 20,
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

      /* const tempMessage = await message.reply({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Emoji Blend',
            description: `${userMention(message.author.id)}, You earned ${bold(
              point,
            )} point(s)!\nYour total point is now ${bold(
              findOneRes?.point || 0 + point,
            )} point(s).\n### This message will be deleted in 1 minute.`,
          },
        ],
      });

      setTimeout(() => {
        tempMessage.delete().catch(() => {});
      }, 1000 * 60); */

      sendNextEmojis();
    }
  } catch (error) {
    console.error(error);
  }
};
