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
      attributes: ['targetLanguage', 'offeredLanguage'],
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

    const clientTargetLanguageArray = clientTargetLanguage.targetLanguage.split(', ');
    const clientOfferedLanguageArray = clientTargetLanguage.offeredLanguage.split(', ');

    const offeredLanguageDynamicSearchConditions = clientTargetLanguageArray.map((keyword) => ({
      offeredLanguage: {
        [Op.substring]: keyword,
      },
    }));

    const targetLanguageDynamicSearchConditions = clientOfferedLanguageArray.map((keyword) => ({
      targetLanguage: {
        [Op.substring]: keyword,
      },
    }));

    const finalSearchCondition = {
      [Op.and]: [
        { [Op.or]: offeredLanguageDynamicSearchConditions },
        { [Op.or]: targetLanguageDynamicSearchConditions },
      ],
    };

    let partnersList = await ExchangePartner.findAll({
      where: finalSearchCondition,
      order: [['updatedAt', 'DESC']],
      limit: 5,
    });

    if (partnersList.length < 5 && targetLanguageDynamicSearchConditions.length > 0) {
      const newSearchCondition = {
        [Op.or]: offeredLanguageDynamicSearchConditions,
      };

      const additionalPartners = await ExchangePartner.findAll({
        where: newSearchCondition,
        order: [['updatedAt', 'DESC']],
        limit: 5 - partnersList.length,
      });

      partnersList = partnersList.concat(additionalPartners);
    }

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
      content = 'There are no exchange partner matches.';
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
