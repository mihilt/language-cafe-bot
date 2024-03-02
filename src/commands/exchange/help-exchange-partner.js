import { SlashCommandBuilder, bold, channelMention } from 'discord.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help-exchange-partner')
    .setDescription('Get help on how to use language exchange partner commands')
    .setDefaultPermission(false),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const title = 'How to Use the find-exchange-partner Channel';

    const description = `Please follow the following steps to be put in our exchange partner database so you can find a partner easier\n\n1. Send ${bold(
      '/register-my-exchange-listing',
    )} in this channel, fill out the questions, then click Done (if you are learning a smaller language, first send ${bold(
      '/get-language-list',
    )} to see what languages are are in our database. If it is not there, please request it to be added in ${channelMention(
      '739915203096870917',
    )})\n2. If it says invalid language, try again and make sure you spell everything correctly\n3. After you have submitted your listing, send ${bold(
      '/get-exchange-listing',
    )} to get your possible exchange partners (it will match your target language up with another person’s native language and sort by recent)\n4. If you would like to edit your listing, send ${bold(
      '/register-my-exchange-listing',
    )} again\n5. If you would like to delete your exchange listing, send ${bold(
      '/delete-my-exchange-listing',
    )} to delete it`;

    return interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title,
          description,
          image: {
            url: 'https://cdn.discordapp.com/attachments/1144589131813503037/1171258140436746250/image.png?ex=655c0625&is=65499125&hm=5fa203e6c18b561452d09c22758f9a1f5edbad3ff6af99885ccd0f464e90f640&',
          },
        },
      ],
      ephemeral: true,
    });
  },
};
