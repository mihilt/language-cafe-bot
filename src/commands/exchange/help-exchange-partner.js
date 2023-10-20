import { SlashCommandBuilder, bold, channelMention } from 'discord.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help-exchange-partner')
    .setDescription('Get help on how to use language exchange partner commands'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const title = 'Find Exchange Partner Message Format';

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
            url: 'https://media.discordapp.net/attachments/1069942934381793330/1164765573327093810/ezgif.com-crop_1.gif?ex=65446778&is=6531f278&hm=f56cf6b2fc88b9720aa4b1e1154c8cf2e2429465e5d3b8e821af1741f0c47e6e&=&width=750&height=411',
          },
        },
      ],
      ephemeral: true,
    });
  },
};
