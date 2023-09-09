import { SlashCommandBuilder, userMention } from 'discord.js';
import { Op } from 'sequelize';
import ExchangePartner from '../../models/ExchangePartner.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-exchange-partner-list')
    .setDescription('Get exchange partner list'),

  async execute(interaction) {
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
      offerLanguage: {
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

    if (partnersList) {
      content = `${userMention(
        interaction.user.id,
      )}, Your language exchange partner list is as follows.\n\n${partnersList
        .map(
          (partner) =>
            `${userMention(partner.id)}\nTarget Language: ${
              partner.targetLanguage
            }\nOffer Language: ${partner.offerLanguage}\nIntroduction: ${partner.introduction}\n\n`,
        )
        .join('')}`;
    } else {
      content = 'There is no language exchange partner list for you.';
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
