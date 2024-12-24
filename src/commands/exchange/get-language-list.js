import { SlashCommandBuilder } from 'discord.js';
import languages from '../../data/languages.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder().setName('get-language-list').setDescription('Get language list'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const content = `These are the list of languages that will be accepted in an exchange partner listing.\nIf you would like another language that is not here to be added, please let us know in \`#public-server-help\`.\n\n${languages
      .map((language) => `- ${language}`)
      .join('\n')}`;

    return interaction.reply({
      embeds: [
        {
          color: 0xc3c3e5,
          title: 'Language List',
          description: content,
        },
      ],
      ephemeral: true,
    });
  },
};
