import { Events } from 'discord.js';
import getExchangeListing from '../service/interaction/is-button/get-exchange-listing.js';
import cooldown from '../service/interaction/is-chat-input-command/cooldown.js';
import GeneratePollModalSubmit from '../service/interaction/is-modal-submit/generate-poll.js';
import RegisterExchangePartnerListModalSubmit from '../service/interaction/is-modal-submit/register-my-exchange-listing.js';
import channelLog, { generateInteractionCreateLogContent } from '../service/utils/channel-log.js';
import joinPomodoroGroup from '../service/interaction/is-button/join-pomodoro-group.js';

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

      if (interaction.customId.startsWith('get-exchange-partner')) {
        getExchangeListing(interaction);
      }

      if (interaction.customId.startsWith('join-pomodoro-group')) {
        joinPomodoroGroup(interaction);
      }
    }
  },
};
