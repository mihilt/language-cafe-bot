import { Events } from 'discord.js';
import cooldown from '../service/interaction/is-chat-input-command/cooldown.js';
import GeneratePollModalSubmit from '../service/interaction/is-modal-submit/generate-poll.js';
import RegisterExchangePartnerListModalSubmit from '../service/interaction/is-modal-submit/register-exchange-partner-list.js';
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

      if (interaction.customId === 'register-exchange-partner-list') {
        channelLog(
          generateInteractionCreateLogContent(
            interaction,
            `customId: ${interaction.customId}\ninteraction.isModalSubmit() is true`,
          ),
        );
        RegisterExchangePartnerListModalSubmit(interaction);
      }
    }
  },
};
