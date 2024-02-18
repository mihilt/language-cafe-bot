import { ActionRowBuilder, ButtonBuilder, ButtonStyle, time, userMention } from 'discord.js';
import { Op } from 'sequelize';
import client from '../../../client/index.js';
import ExchangePartner from '../../../models/ExchangePartner.js';

export default async (interaction) => {
  const clientTargetLanguage = await ExchangePartner.findOne({
    where: { id: interaction.user.id },
    attributes: ['targetLanguage', 'offeredLanguage'],
  });

  if (!clientTargetLanguage) {
    await interaction.update({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Get Language Exchange Partner Listing',
          description: `${userMention(
            interaction.user.id,
          )}, you have not registered your language exchange partner listing yet.`,
        },
      ],
      components: [],
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

  const SearchCondition = {
    [Op.and]: [
      { [Op.or]: offeredLanguageDynamicSearchConditions },
      { [Op.or]: targetLanguageDynamicSearchConditions },
    ],
  };

  const partnerListLength = await ExchangePartner.count({
    where: SearchCondition,
  });

  if (partnerListLength === 0) {
    await interaction.update({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Get Language Exchange Partner Listing',
          description: `${userMention(
            interaction.user.id,
          )}, there are no exchange partner matches.`,
        },
      ],
      components: [],
      ephemeral: true,
    });

    return;
  }

  const { customId } = interaction;
  const previous = interaction.message;
  const currentPage = previous.embeds[0].title.split('/')[0];

  let offset;
  if (customId === 'get-exchange-partner-first') {
    offset = 0;
  } else if (customId === 'get-exchange-partner-previous') {
    offset = currentPage - 2;
  } else if (customId === 'get-exchange-partner-next') {
    offset = currentPage;
  } else if (customId === 'get-exchange-partner-last') {
    offset = partnerListLength - 1;
  }

  const page = +offset + 1;

  const partner = await ExchangePartner.findOne({
    where: SearchCondition,
    order: [['updatedAt', 'DESC']],
    offset,
  });

  if (!partner) {
    await interaction.update({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Get Language Exchange Partner Listing',
          description: `${userMention(
            interaction.user.id,
          )}, there are no exchange partner matches.`,
        },
      ],
      components: [],
      ephemeral: true,
    });

    return;
  }

  const partnerObject = await client.users.fetch(partner.id);

  await interaction.update({
    embeds: [
      {
        color: 0x65a69e,
        title: `${page}/${partnerListLength} Partner`,
        description: `${userMention(partnerObject.id)}`,
        fields: [
          {
            name: 'Target Language(s)',
            value: `\`\`\`${partner.targetLanguage}\`\`\``,
          },
          {
            name: 'Offered Language(s)',
            value: `\`\`\`${partner.offeredLanguage}\`\`\``,
          },
          {
            name: 'Introduction',
            value: `\`\`\`${partner.introduction}\`\`\``,
          },
          {
            name: 'Last updated',
            value: `${time(partner.updatedAt, 'F')}`,
          },
        ],
        author: {
          name: `${partnerObject?.globalName}(${partnerObject?.username}#${partnerObject?.discriminator})`,
          icon_url: partnerObject?.avatarURL(),
        },
      },
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('get-exchange-partner-first')
          .setLabel('<<')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId('get-exchange-partner-previous')
          .setLabel('<')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId('get-exchange-partner-next')
          .setLabel('>')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === partnerListLength),
        new ButtonBuilder()
          .setCustomId('get-exchange-partner-last')
          .setLabel('>>')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === partnerListLength),
      ),
    ],
    ephemeral: true,
  });
};
