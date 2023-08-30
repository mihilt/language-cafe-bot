import { Events } from 'discord.js';
import cooldown from '../interaction/is-chat-input-command/cooldown.js';
import GeneratePollChatInputCommand from '../interaction/is-chat-input-command/generate-poll.js';
import GeneratePollModalSubmit from '../interaction/is-modal-submit/generate-poll.js';

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
        GeneratePollModalSubmit(interaction);
      }
    }
  },
};
