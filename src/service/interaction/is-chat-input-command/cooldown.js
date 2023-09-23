import { Collection, time } from 'discord.js';
import client from '../../../client/index.js';

export default async (interaction) => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return {
      shouldReturn: true,
    };
  }

  const { cooldowns } = client;

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const defaultCooldownDuration = 5;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      interaction.reply({
        content: `Please wait, you are on a cooldown for \`${
          command.data.name
        }\`. You can use it again ${time(expiredTimestamp, 'R')}.`,
        ephemeral: true,
      });
      return {
        shouldReturn: true,
      };
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }

  return {
    shouldReturn: false,
  };
};
