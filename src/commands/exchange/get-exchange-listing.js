import { SlashCommandBuilder, time, userMention } from 'discord.js';
import { Op } from 'sequelize';
import ExchangePartner from '../../models/ExchangePartner.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';
import client from '../../client/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-exchange-listings')
    .setDescription('Get exchange partner list'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const clientTargetLanguage = await ExchangePartner.findOne({
      where: { id: interaction.user.id },
      attributes: ['targetLanguage', 'offeredLanguage'],
    });

    if (!clientTargetLanguage) {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Get Language Exchange Partner List',
            description: `${userMention(
              interaction.user.id,
            )}, you have not registered your language exchange partner list.`,
          },
        ],
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
        [Op.and]: [
          { [Op.or]: offeredLanguageDynamicSearchConditions },
          { id: { [Op.notIn]: partnersList.map((partner) => partner.id) } },
        ],
      };

      const additionalPartners = await ExchangePartner.findAll({
        where: newSearchCondition,
        order: [['updatedAt', 'DESC']],
        limit: 5 - partnersList.length,
      });

      partnersList = partnersList.concat(additionalPartners);
    }

    if (!partnersList.length > 0) {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Get Language Exchange Partner List',
            description: 'There are no exchange partner matches.',
          },
        ],
        ephemeral: true,
      });

      return;
    }

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Get Language Exchange Partner List',
          description: `${userMention(
            interaction.user.id,
          )}, your exchange partner matches are as follows.`,
        },
      ],
      ephemeral: true,
    });

    partnersList.forEach(async (partner, index) => {
      const partnerObject = await client.users.fetch(partner.id);

      await interaction.followUp({
        embeds: [
          {
            color: 0x65a69e,
            title: `#${index + 1} Exchange Partner`,
            description: `${userMention(partner.id)}\n\nTarget Language(s)\`\`\`${
              partner.targetLanguage
            }\`\`\`\nOffered Language(s)\`\`\`${
              partner.offeredLanguage
            }\`\`\`\nIntroduction\`\`\`\n${partner.introduction}\`\`\`\nLast updated: ${time(
              +new Date(partner.updatedAt).getTime().toString().slice(0, 10),
              'F',
            )}`,
            author: {
              name: partnerObject?.username,
              icon_url: partnerObject?.avatarURL(),
            },
          },
        ],
        ephemeral: true,
      });
    });
  },
};
