import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import Category from '../../models/category.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-categories')
    .setDescription('Get categories')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const categories = await Category.find().sort({ createdAt: 1 });

    const description = categories.map((category) => category.message).join('\n\n');

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Categories',
          description: `\`\`\`\n${description}\n\`\`\``,
        },
      ],
      ephemeral: true,
    });
  },
};
