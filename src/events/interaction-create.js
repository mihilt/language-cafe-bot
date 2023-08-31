import { Events } from 'discord.js';
import cooldown from '../service/interaction/is-chat-input-command/cooldown.js';
import GeneratePollChatInputCommand from '../service/interaction/is-chat-input-command/generate-poll.js';
import GeneratePollModalSubmit from '../service/interaction/is-modal-submit/generate-poll.js';
import channelLog, { generateInteractionMessage } from '../util/channel-log.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const cooldownRes = await cooldown(interaction);
      if (cooldownRes?.shouldReturn) return;

      if (interaction.commandName === 'generate-poll') {
        GeneratePollChatInputCommand(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'generate-poll') {
        channelLog(
          generateInteractionMessage(
            interaction,
            `customId: ${interaction.customId}\ninteraction.isModalSubmit() is true`,
          ),
        );
        GeneratePollModalSubmit(interaction);
      }
    }
  },
};
