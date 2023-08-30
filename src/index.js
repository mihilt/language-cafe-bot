import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import keyv from './db/keyv.js';
import GeneratePollChatInputCommand from './interaction/chat-input-command/generate-poll.js';
import GeneratePollModalSubmit from './interaction/modal-submit/generate-poll.js';
import suggestionBoxMessageCreate from './messageCreate/suggestion-box.js';

const configUrl =
  process.env.NODE_ENV === 'production' ? './config/config_pro.json' : './config/config_dev.json';

const fileUrl = new URL(configUrl, import.meta.url);
const config = JSON.parse(await readFile(fileUrl, 'utf8'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.cooldowns = new Collection();
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

keyv.on('error', (err) => console.error('Keyv connection error:', err));

if (!(await keyv.has('user'))) {
  await keyv.set('user', []);
}

// eslint-disable-next-line no-restricted-syntax
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  // eslint-disable-next-line no-restricted-syntax
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    (async () => {
      const command = (await import(filePath)).default;

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    })();
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

// eslint-disable-next-line no-restricted-syntax
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  (async () => {
    const event = (await import(filePath)).default;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  })();
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
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
        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
        ephemeral: true,
      });
      return;
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
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate-poll') {
    GeneratePollChatInputCommand(interaction);
  }
});

// Listen for the modal submit event
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'generate-poll') {
    GeneratePollModalSubmit(interaction);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // if channel is #suggention-box, create a thread and react
  if (message.channel.id === '739915251864043640') {
    suggestionBoxMessageCreate(message);
  }
});

client.login(config.DISCORD_TOKEN);
