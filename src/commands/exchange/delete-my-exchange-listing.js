import { SlashCommandBuilder, userMention } from 'discord.js';
import ExchangePartner from '../../models/ExchangePartner.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('delete-my-exchange-listing')
    .setDescription('Delete exchange partner list'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    ExchangePartner.destroy({ where: { id: interaction.user.id } });

    const content = `${userMention(
      interaction.user.id,
    )}, your language exchange partner listing was removed from our database.`;

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Delete Language Exchange Partner List',
          description: content,
        },
      ],
      ephemeral: true,
    });
  },
};
