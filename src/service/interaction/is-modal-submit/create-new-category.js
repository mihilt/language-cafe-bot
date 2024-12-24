import A_TO_Z from '../../../data/a2z.js';
import Category from '../../../models/category.js';

export default async (interaction) => {
  try {
    const message = interaction.fields.getTextInputValue('message');

    const res = await Category.create({
      message,
      alphabet: A_TO_Z,
    });

    if (res) {
      await interaction.reply({
        embeds: [
          {
            color: 0xc3c3e5,
            description: `Category created successfully\n\nMessage\`\`\`\n${message}\n\`\`\``,
          },
        ],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [
          {
            color: 0xc3c3e5,
            description: 'Failed to create category',
          },
        ],
        ephemeral: true,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await interaction.reply({
      embeds: [
        {
          color: 0xc3c3e5,
          description: 'Failed to create category (Internal Server Error)',
        },
      ],
      ephemeral: true,
    });
  }
};
