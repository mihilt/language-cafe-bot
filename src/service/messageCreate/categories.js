import config from '../../config/index.js';
import alphabetEmojis from '../../data/alphabet-emojis.js';
import Category from '../../models/category.js';

export default async (message) => {
  try {
    const { content: clientContent } = message;

    const temp = clientContent.match(/\(([^)]+)\)/);

    // check if the message contains something like (category)
    if (!temp) {
      return;
    }

    const clientAlphabet = temp[1][0].toUpperCase();

    // check if the first character of the category is not an alphabet
    if (clientAlphabet.charCodeAt(0) < 65 || clientAlphabet.charCodeAt(0) > 90) {
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

    let filteredCategoryAlphabet = currentCategoryAlphabet.replace(clientAlphabet, '');

    if (filteredCategoryAlphabet.length === 0) {
      await message.channel.send({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Category Completed',
            description: `\`\`\`${currentCategory.message}\`\`\``,
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

      filteredCategoryAlphabet = currentCategory.alphabet;
    } else {
      await Category.updateOne(
        { _id: currentCategory._id },
        {
          alphabet: filteredCategoryAlphabet,
        },
      );
      message.react(alphabetEmojis[clientAlphabet]).catch(() => {});
    }

    const title = 'Current Category';

    const description = `\`\`\`${
      currentCategory.message
    }\`\`\`\n### Remaining Letters\n${filteredCategoryAlphabet
      .split('')
      .map((e) => alphabetEmojis[e])
      .join(', ')}`;

    const currentMessages = await message.channel.messages.fetch({ limit: 50 });

    const stickyMessage = currentMessages.find(
      (currentMessage) =>
        currentMessage?.author?.id === config.CLIENT_ID &&
        currentMessage?.embeds[0]?.title === title,
    );

    await stickyMessage?.delete().catch(() => {});

    await message.channel.send({
      embeds: [
        {
          color: 0x65a69e,
          title,
          description,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
