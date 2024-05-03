import Category from '../../../models/category.js';

export default async (interaction) => {
  const message = interaction.fields.getTextInputValue('message');
  const exceptedLetters = interaction.fields.getTextInputValue('excepted-letters');

  const refinedLetters = exceptedLetters
    .toUpperCase()
    .split('')
    .filter((e) => /[a-zA-Z]/.test(e))
    .join('');

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    .split('')
    .filter((e) => !refinedLetters.includes(e))
    .join('');

  const res = await Category.create({
    message,
    alphabet: letters,
  });

  if (res) {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: `Category created successfully\n\nMessage\`\`\`\n${message}\n\`\`\`\nRemaining Letters\`\`\`\n${letters
            .split('')
            .join(',')}\n\`\`\``,
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
