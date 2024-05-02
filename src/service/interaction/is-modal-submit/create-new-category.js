import Category from '../../../models/category.js';

export default async (interaction) => {
  const message = interaction.fields.getTextInputValue('message');

  const res = await Category.create({
    message,
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  });

  if (res) {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Category created successfully',
        },
      ],
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Failed to create category',
        },
      ],
      ephemeral: true,
    });
  }
};
