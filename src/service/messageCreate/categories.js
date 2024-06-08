import { userMention } from 'discord.js';
import latinize from 'latinize';
import config from '../../config/index.js';
import alphabetEmojis from '../../data/alphabet-emojis.js';
import flagEmojis from '../../data/flag-emojis.js';
import CategoryScore from '../../models/category-score.js';
import Category from '../../models/category.js';
import A_TO_Z from '../../data/a2z.js';
import Point from '../../models/point.js';

const sendNewStickyMessage = async ({ message, currentCategory, filteredCategoryAlphabet }) => {
  const title = 'Current Category';

  const currentMessages = await message.channel.messages.fetch({ limit: 50 });

  const stickyMessages = currentMessages.filter(
    (currentMessage) =>
      currentMessage?.author?.id === config.CLIENT_ID && currentMessage?.embeds[0]?.title === title,
  );

  await Promise.all(stickyMessages.map((stickyMessage) => stickyMessage.delete().catch(() => {})));

  if (filteredCategoryAlphabet.length === 1) {
    await message.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          title,
          footer: {
            text: 'There is only one letter left, so you can use any word that contains the letter, not just one that starts with it.',
          },
        },
      ],
    });
  }

  await message.channel.send({
    embeds: [
      {
        color: 0x65a69e,
        title,
        description: `Category\n\`\`\`\n${
          currentCategory.message
        }\n\`\`\`\nRemaining Letters\n${filteredCategoryAlphabet
          .split('')
          .map((e) => alphabetEmojis[e])
          .join(
            ', ',
          )}\n\nHow to Play\nhttps://discord.com/channels/739911855795077282/1235394383700955217/1235681286559895624`,
      },
    ],
  });
};

export default async (message) => {
  try {
    const { content: clientContent } = message;

    if (!flagEmojis.some((flagEmoji) => clientContent.includes(flagEmoji))) {
      return;
    }

    let currentCategory = await Category.findOne().sort({ createdAt: 1 });

    if (!currentCategory) {
      message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            description:
              'There is no category.\nPlease ping the moderator to create a new category. ',
          },
        ],
      });

      return;
    }

    const currentCategoryAlphabet = currentCategory.alphabet;

    const isLastAlphabet = currentCategoryAlphabet.length === 1;

    const clientAlphabet = (() => {
      const latinizedContent = latinize(clientContent).toUpperCase();
      const letters = latinizedContent.split('').filter((char) => /[a-zA-Z]/.test(char));
      if (isLastAlphabet) {
        return letters.includes(currentCategoryAlphabet) ? currentCategoryAlphabet : null;
      }
      return letters[0];
    })();

    let filteredCategoryAlphabet = currentCategoryAlphabet.replace(clientAlphabet, '');

    if (!clientAlphabet || !currentCategoryAlphabet.includes(clientAlphabet)) {
      await sendNewStickyMessage({
        message,
        currentCategory,
        filteredCategoryAlphabet,
      });
      message.react('❌').catch(() => {});
      return;
    }

    message.react(alphabetEmojis[clientAlphabet]).catch(() => {});

    const score = (() => {
      if (isLastAlphabet) {
        return 2.9;
      }
      if (currentCategoryAlphabet.length <= 3) {
        return 1.9;
      }
      if (currentCategoryAlphabet.length <= 5) {
        return 1.01;
      }
      return 1;
    })();

    const messageAuthorId = message.author.id;

    await CategoryScore.updateOne({ id: messageAuthorId }, { $inc: { score } }, { upsert: true });
    await Point.updateOne(
      { id: messageAuthorId },
      { $inc: { categories: currentCategoryAlphabet.length < 8 ? 5 : 8 } },
      { upsert: true },
    );

    if (filteredCategoryAlphabet.length === 0) {
      const categoryScores = await CategoryScore.find().sort({ score: -1, createdAt: 1 }).limit(1);

      const dbUser = categoryScores[0];

      const user = await message.client.users.fetch(dbUser.id);

      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Category Completed',
            description: `Category\n\`\`\`\n${
              currentCategory.message
            }\n\`\`\`\nThe Biggest Contributor\n${userMention(dbUser.id)}`,
            thumbnail: {
              url: user.avatarURL(),
            },
          },
        ],
      });

      await CategoryScore.deleteMany({});

      await Category.deleteOne({ _id: currentCategory._id });

      /* await Category.create({
        message: currentCategory.message,
        alphabet: A_TO_Z,
      }); */

      currentCategory = await Category.findOne().sort({ createdAt: 1 });

      if (!currentCategory) {
        await message.channel.send({
          embeds: [
            {
              color: 0x65a69e,
              description:
                'There is no category.\nPlease ping the moderator to create a new category. ',
            },
          ],
        });

        return;
      }

      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            title: 'New Category',
            description: `\`\`\`\n${currentCategory.message}\n\`\`\``,
          },
        ],
      });

      filteredCategoryAlphabet = currentCategory.alphabet;
    } else {
      await Category.updateOne(
        { _id: currentCategory._id },
        {
          alphabet: filteredCategoryAlphabet,
        },
      );
    }

    await sendNewStickyMessage({
      message,
      currentCategory,
      filteredCategoryAlphabet,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
