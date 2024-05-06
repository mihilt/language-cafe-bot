import { userMention } from 'discord.js';
import latinize from 'latinize';
import config from '../../config/index.js';
import alphabetEmojis from '../../data/alphabet-emojis.js';
import flagEmojis from '../../data/flag-emojis.js';
import CategoryScore from '../../models/category-score.js';
import Category from '../../models/category.js';

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

    if (!clientAlphabet || !currentCategoryAlphabet.includes(clientAlphabet)) {
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
      return 1;
    })();

    const messageAuthorId = message.author.id;

    const findOneRes = await CategoryScore.findOne({ id: messageAuthorId });

    if (!findOneRes) {
      const categoryScore = new CategoryScore({
        id: messageAuthorId,
        score,
      });
      await categoryScore.save();
    } else {
      await CategoryScore.updateOne({ id: messageAuthorId }, { $inc: { score } });
    }

    const title = 'Current Category';

    const currentMessages = await message.channel.messages.fetch({ limit: 50 });

    const stickyMessages = currentMessages.filter(
      (currentMessage) =>
        currentMessage?.author?.id === config.CLIENT_ID &&
        currentMessage?.embeds[0]?.title === title,
    );

    await Promise.all(
      stickyMessages.map((stickyMessage) => stickyMessage.delete().catch(() => {})),
    );

    let filteredCategoryAlphabet = currentCategoryAlphabet.replace(clientAlphabet, '');

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
            }\n\`\`\`\nThe Best Contributor\n${userMention(dbUser.id)}`,
            thumbnail: {
              url: user.avatarURL(),
            },
          },
        ],
      });

      await CategoryScore.deleteMany({});

      await Category.deleteOne({ _id: currentCategory._id });
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

    if (filteredCategoryAlphabet.length === 1) {
      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            title,
            footer: {
              text: 'There is only one letter left, and you can use any word that contains the letter, not just one that starts with it.',
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
