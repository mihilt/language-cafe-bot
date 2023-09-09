import { SlashCommandBuilder, userMention } from 'discord.js';
import NewMember from '../../models/NewMember.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';
import { checkMaxContentLength } from '../../utils/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('extract-new-members')
    .setDescription('Extract new members'),

  execute: async (interaction) => {
    const members = await NewMember.findAll();
    let content = '';

    if (members.length === 0) {
      content = 'There are no new members.';
    } else {
      content += `Welcome everyone! What languages are you interested in learning? ${members
        .map((member) => userMention(member.id))
        .join(' ')}`;
    }

    let contentWithCodeBlock = `\`\`\`${content}\`\`\``;

    contentWithCodeBlock = checkMaxContentLength({ length: 4096, content: contentWithCodeBlock });

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Extract New Members',
          description: contentWithCodeBlock,
          footer: {
            text: 'Click copy icon to copy the content.',
          },
        },
      ],
      ephemeral: true,
    });

    await NewMember.destroy({ truncate: true });

    channelLog(
      generateInteractionCreateLogContent(interaction, `content: ${contentWithCodeBlock}`),
    );
  },
};