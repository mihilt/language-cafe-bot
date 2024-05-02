import { SlashCommandBuilder } from 'discord.js';
import Category from '../../models/category.js';

export default {
  data: new SlashCommandBuilder().setName('get-categories').setDescription('Get categories'),

  async execute(interaction) {
    const categories = await Category.find().sort({ createdAt: 1 });

    const description = categories.map((category) => category.message).join('\n\n');

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Categories',
          description: `\`\`\`${description}\`\`\``,
        },
      ],
      ephemeral: true,
    });
  },
};
