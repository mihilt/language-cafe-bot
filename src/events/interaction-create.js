import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  time,
  userMention,
} from 'discord.js';
import { Op } from 'sequelize';
import client from '../client/index.js';
import ExchangePartner from '../models/ExchangePartner.js';
import cooldown from '../service/interaction/is-chat-input-command/cooldown.js';
import GeneratePollModalSubmit from '../service/interaction/is-modal-submit/generate-poll.js';
import RegisterExchangePartnerListModalSubmit from '../service/interaction/is-modal-submit/register-my-exchange-listing.js';
import channelLog, { generateInteractionCreateLogContent } from '../service/utils/channel-log.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const cooldownRes = await cooldown(interaction);
      if (cooldownRes?.shouldReturn) return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'generate-poll') {
        channelLog(
          generateInteractionCreateLogContent(
            interaction,
            `customId: ${interaction.customId}\ninteraction.isModalSubmit() is true`,
          ),
        );
        GeneratePollModalSubmit(interaction);
        return;
      }

      if (interaction.customId === 'register-my-exchange-listing') {
        channelLog(
          generateInteractionCreateLogContent(
            interaction,
            `customId: ${interaction.customId}\ninteraction.isModalSubmit() is true`,
          ),
        );
        RegisterExchangePartnerListModalSubmit(interaction);
      }
    }

    if (interaction.isButton()) {
      channelLog(
        generateInteractionCreateLogContent(
          interaction,
          `customId: ${interaction.customId}\ninteraction.isButton() is true`,
        ),
      );

      const clientTargetLanguage = await ExchangePartner.findOne({
        where: { id: interaction.user.id },
        attributes: ['targetLanguage', 'offeredLanguage'],
      });

      if (!clientTargetLanguage) {
        await interaction.update({
          embeds: [
            {
              color: 0x65a69e,
              title: 'Get Language Exchange Partner List',
              description: `${userMention(
                interaction.user.id,
              )}, you have not registered your language exchange partner list.`,
            },
          ],
          components: [],
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
        await interaction.update({
          embeds: [
            {
              color: 0x65a69e,
              title: 'Get Language Exchange Partner List',
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
      if (customId === 'first') {
        offset = 0;
      } else if (customId === 'previous') {
        offset = currentPage - 2;
      } else if (customId === 'next') {
        offset = currentPage;
      } else if (customId === 'last') {
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
              title: 'Get Language Exchange Partner List',
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
            fields: [
              {
                name: '',
                value: `${userMention(partnerObject.id)}`,
              },
              {
                name: '',
                value: '',
              },
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
                name: '\u200B',
                value: `Last updated: ${time(partner.updatedAt, 'F')}`,
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
              .setCustomId('first')
              .setLabel('<<')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 1),
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('<')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 1),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('>')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === partnerListLength),
            new ButtonBuilder()
              .setCustomId('last')
              .setLabel('>>')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === partnerListLength),
          ),
        ],
        ephemeral: true,
      });
    }
  },
};
