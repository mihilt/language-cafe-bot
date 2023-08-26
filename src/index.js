import { Client, Collection, Events, GatewayIntentBits, bold } from 'discord.js';
import fs from 'fs';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import keyv from './db/keyv.js';

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

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith('!lc')) return;

  if (message.content.startsWith('!lc-study-check-in')) {
    const users = await keyv.get('user');
    const user = users[message.author.id];

    const currentDate = new Date();
    const nextDayTemp = new Date(currentDate);
    nextDayTemp.setDate(currentDate.getDate() + 1);
    nextDayTemp.setHours(23, 59, 59, 0);
    const nextDay = new Date(nextDayTemp);

    const expiredTimestamp = nextDay.getTime();
    const currentTimestamp = currentDate.getTime();

    // check if user.lastAttendanceTimestamp and currentTimestamp is in the same day
    if (new Date(user?.lastAttendanceTimestamp).getDate() === currentDate.getDate()) {
      const ableToAttendDate = new Date(currentDate);
      ableToAttendDate.setDate(currentDate.getDate() + 1);
      ableToAttendDate.setHours(0, 0, 0, 0);
      const ableToAttendTimestamp = ableToAttendDate.getTime();

      await message.react('❌');

      const embad = {
        color: 0x65a69e,
        title: 'Study Check In',
        description: `<@${
          message.author.id
        }>, you have already logged your study session today.\nCome back <t:${ableToAttendTimestamp
          .toString()
          .slice(0, 10)}:R> to increase your streak!`,
      };

      await message.reply({ embeds: [embad] });
      return;
    }

    // check if user.expiredTimestamp is less than currentTimestamp reset streak
    if (user?.expiredTimestamp < currentTimestamp) {
      user.point = 0;
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

    const content = `<@${
      message.author.id
    }>, you studied for ${point} day(s) in a row!\nStudy streak increased to ${bold(
      point,
    )} 🔥\n\nCome back tomorrow to increase your streak!\nStreak expires <t:${new Date(
      expiredTimestamp,
    )
      .getTime()
      .toString()
      .slice(0, 10)}:R>`;

    await message.react('✅');

    const embed = {
      color: 0x65a69e,
      title: 'Study Check In',
      description: content,
    };

    await message.reply({ embeds: [embed] });

    // put message if your streak expired
    if (point === 1 && user?.lastAttendanceTimestamp) {
      const additionalContent = `<@${
        message.author.id
      }>, your streak was reset to 0 due to missing one or more days previously.\nYour streak has been updated to ${bold(
        1,
      )} after logging today's session.\n\nYour last study session was logged <t:${user.lastAttendanceTimestamp
        .toString()
        .slice(0, 10)}:R>.`;

      const additionalEmbed = {
        color: 0x65a69e,
        title: 'Study Check In',
        description: additionalContent,
      };

      await message.reply({ embeds: [additionalEmbed] });
    }
  }
});

client.login(config.DISCORD_TOKEN);
