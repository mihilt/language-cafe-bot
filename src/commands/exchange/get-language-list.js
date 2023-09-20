import { SlashCommandBuilder } from 'discord.js';
import languages from '../../data/languages.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder().setName('get-language-list').setDescription('Get language list'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    return interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Language List',
          description: languages.map((language) => `- ${language}`).join('\n'),
        },
      ],
      ephemeral: true,
    });
  },
};
