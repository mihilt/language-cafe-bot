import { Client, GatewayIntentBits, userMention, Events, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import keyv from './db/keyv.js';

import config from './config/config.json' assert { type: 'json' };

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

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
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

client.on('ready', () => {
  console.log(`\nLogged in as ${client.user.tag}!\n`);
});

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
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      return interaction.reply({
        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
        ephemeral: true,
      });
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

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith('!ws')) return;

  if (message.content.includes('!ws-study-check-in')) {
    const users = await keyv.get('user');
    const user = users[message.author.id];

    const currentDate = new Date();
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    nextDay.setHours(23, 59, 59, 0);
    const expiredTimestamp = nextDay.getTime();
    const currentTimestamp = currentDate.getTime();

    // check if user.lastAttendanceTimestamp and currentTimestamp is in the same day
    if (new Date(user?.lastAttendanceTimestamp).getDate() === currentDate.getDate()) {
      const ableToAttend = new Date(currentDate);
      ableToAttend.setDate(currentDate.getDate() + 1);
      ableToAttend.setHours(0, 0, 0, 0);
      const ableToAttendTimestamp = ableToAttend.getTime();

      await message.react('❌');
      await message.reply(
        `You already attended today.\nAttendable time: <t:${ableToAttendTimestamp
          .toString()
          .slice(0, 10)}:R>`,
      );
      return;
    }

    let additionalContent = '';

    if (user?.expiredTimestamp < currentTimestamp) {
      user.point = 0;
      additionalContent = `\n\nYour points have been initialized. (last attendance: <t:${new Date(
        user.lastAttendanceTimestamp,
      )
        .getTime()
        .toString()
        .slice(0, 10)}:R>)`;
    }

    let point = user?.point ?? 0;
    point += 1;

    await keyv.set('user', {
      ...users,
      [message.author.id]: {
        point,
        lastAttendanceTimestamp: currentTimestamp,
        expiredTimestamp,
      },
    });

    const content =
      `<@${message.author.id}> attended for ${point} days in a row. ✅\nExpired time: <t:${new Date(
        expiredTimestamp,
      )
        .getTime()
        .toString()
        .slice(0, 10)}:R>` + additionalContent;

    await message.react('✅');
    await message.reply(content);
  }
});

client.login(config.DISCORD_TOKEN);
