import { SlashCommandBuilder, userMention } from 'discord.js';
import { Op } from 'sequelize';
import ExchangePartner from '../../models/ExchangePartner.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-exchange-listing')
    .setDescription('Get exchange partner list'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const clientTargetLanguage = await ExchangePartner.findOne({
      where: { id: interaction.user.id },
      attributes: ['targetLanguage'],
    });

    if (!clientTargetLanguage) {
      await interaction.reply({
        content: `${userMention(
          interaction.user.id,
        )}, you have not registered your language exchange partner list.`,
        ephemeral: true,
      });
      return;
    }

    const clientTargetLanguageArray = clientTargetLanguage.targetLanguage.match(/.{1,4}/g);

    const dynamicSearchConditions = clientTargetLanguageArray.map((keyword) => ({
      offeredLanguage: {
        [Op.substring]: keyword,
      },
    }));

    const finalSearchCondition = {
      [Op.or]: dynamicSearchConditions,
    };

    const partnersList = await ExchangePartner.findAll({
      where: finalSearchCondition,
      order: [['updatedAt', 'ASC']],
      limit: 5,
    });

    let content = '';

    if (partnersList.length > 0) {
      content = `${userMention(
        interaction.user.id,
      )}, your exchange partner matches are as follows.\n\n${partnersList
        .map(
          (partner) =>
            `${userMention(partner.id)}\n\`\`\`Target Language(s): ${
              partner.targetLanguage
            }\nOffered Language(s): ${partner.offeredLanguage}\nIntroduction: ${
              partner.introduction
            }\`\`\`\n`,
        )
        .join('')}`;
    } else {
      content = 'You have not submitted your language exchange partner listing yet.';
    }

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Get Language Exchange Partner List',
          description: content,
        },
      ],
      ephemeral: true,
    });
  },
};
