import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  time,
  userMention,
} from 'discord.js';
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

    const offeredLanguageDynamicSearchConditions = clientTargetLanguageArray.map((keyword) => ({
      offeredLanguage: {
        [Op.substring]: keyword,
      },
    }));

    const SearchCondition = {
      [Op.and]: [{ [Op.or]: offeredLanguageDynamicSearchConditions }],
    };

    const partnerListLength = await ExchangePartner.count({
      where: SearchCondition,
    });

    if (partnerListLength === 0) {
      await interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            title: 'Get Language Exchange Partner List',
            description: `${userMention(
              interaction.user.id,
            )}, there are no exchange partner matches.`,
          },
        ],
        ephemeral: true,
      });

      return;
    }

    const partner = await ExchangePartner.findOne({
      where: SearchCondition,
      order: [['updatedAt', 'DESC']],
    });

    const partnerObject = await client.users.fetch(partner.id);

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: `1/${partnerListLength} Partner`,
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
              value: time(partner.updatedAt, 'F'),
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
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('get-exchange-partner-previous')
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('get-exchange-partner-next')
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(partnerListLength === 1),
          new ButtonBuilder()
            .setCustomId('get-exchange-partner-last')
            .setLabel('>>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(partnerListLength === 1),
        ),
      ],
      ephemeral: true,
    });
  },
};
