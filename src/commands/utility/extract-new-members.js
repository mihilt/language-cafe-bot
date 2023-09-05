import { SlashCommandBuilder, userMention } from 'discord.js';
import NewMember from '../../models/NewMember.js';
import channelLog, { generateInteractionCreateLogContent } from '../../util/channel-log.js';

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

    await interaction.reply({
      content: `\`\`\`${content}\`\`\``,
      ephemeral: true,
    });

    await NewMember.destroy({ truncate: true });

    channelLog(generateInteractionCreateLogContent(interaction, `content: ${content}`));
  },
};
