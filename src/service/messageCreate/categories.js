import latinize from 'latinize';
import config from '../../config/index.js';
import alphabetEmojis from '../../data/alphabet-emojis.js';
import Category from '../../models/category.js';
import flagEmojis from '../../data/flag-emojis.js';

export default async (message) => {
  try {
    const { content: clientContent } = message;

    if (!flagEmojis.some((flagEmoji) => clientContent.includes(flagEmoji))) {
      return;
    }

    const clientAlphabet = latinize(clientContent)
      .split('')
      .filter((e) => /[a-zA-Z]/.test(e))[0]
      ?.toUpperCase();

    if (!clientAlphabet) {
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

    if (!currentCategoryAlphabet.includes(clientAlphabet)) {
      message.react('❌').catch(() => {});
      return;
    }

    message.react(alphabetEmojis[clientAlphabet]).catch(() => {});

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
      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Category Completed',
            description: `\`\`\`\n${currentCategory.message}\n\`\`\``,
          },
        ],
      });

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
