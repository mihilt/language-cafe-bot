import {
  ActionRowBuilder,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import fs from 'fs';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import keyv from './db/keyv.js';
import pollEmojiArray from './util/poll-emoji-array.js';

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
  if (message.channel.id === '739915251864043640') {
    await message.channel.threads.create({
      name: 'New Thread',
      // seven days
      autoArchiveDuration: 10080,
      startMessage: message.id,
    });

    await message.react('783705863381975070');
    await message.react('783705940230144001');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate-poll') {
    const modal = new ModalBuilder().setCustomId('generate-poll').setTitle('Generate a poll');

    const messageContent = new TextInputBuilder()
      .setCustomId('messageContent')
      .setLabel("Put message's content.")
      .setStyle(TextInputStyle.Paragraph);

    const startDate = new TextInputBuilder()
      .setCustomId('startDate')
      .setLabel('Put start date. format: YYYYMMDD')
      .setStyle(TextInputStyle.Short)
      .setMinLength(8)
      .setMaxLength(8);

    const startHours = new TextInputBuilder()
      .setCustomId('startHours')
      .setLabel('Put start hours. format: HH (24 hours)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(2)
      .setMaxLength(2);

    const gmt = new TextInputBuilder()
      .setCustomId('gmt')
      .setLabel('Put gmt. format: +/-HH:MM')
      .setStyle(TextInputStyle.Short)
      .setMinLength(6)
      .setMaxLength(6);

    const numberOfPolls = new TextInputBuilder()
      .setCustomId('numberOfPolls')
      .setLabel('Put number of polls. (1~20)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(2);

    modal.addComponents(
      new ActionRowBuilder().addComponents(messageContent),
      new ActionRowBuilder().addComponents(startDate),
      new ActionRowBuilder().addComponents(startHours),
      new ActionRowBuilder().addComponents(gmt),
      new ActionRowBuilder().addComponents(numberOfPolls),
    );

    await interaction.showModal(modal);
  }
});

// Listen for the modal submit event
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'generate-poll') {
    const messageContent = interaction.fields.getTextInputValue('messageContent');
    const startDate = interaction.fields.getTextInputValue('startDate');
    const startHours = interaction.fields.getTextInputValue('startHours');
    const gmt = interaction.fields.getTextInputValue('gmt');
    const numberOfPolls = interaction.fields.getTextInputValue('numberOfPolls');

    // check if startDate is valid date
    const date = new Date(
      `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`,
    );
    if (Number.isNaN(date.getTime())) {
      await interaction.reply({
        content: 'Please enter a valid date.',
        ephemeral: true,
      });
      return;
    }

    // check if startHours is valid hours
    let hours = parseInt(startHours, 10);
    if (Number.isNaN(hours) || hours < 0 || hours > 23) {
      await interaction.reply({
        content: 'Please enter a valid hours.',
        ephemeral: true,
      });
      return;
    }

    // check if gmt is valid +/-HH:MM
    const gmtHours = parseInt(gmt.slice(1, 3), 10);
    const gmtMinutes = parseInt(gmt.slice(4, 6), 10);
    const gmtSign = gmt[0];
    if (
      (gmtSign !== '+' && gmtSign !== '-') ||
      Number.isNaN(gmtHours) ||
      Number.isNaN(gmtMinutes)
    ) {
      await interaction.reply({
        content: 'Please enter a valid gmt.',
        ephemeral: true,
      });
      return;
    }

    const realGmtHours = gmtSign === '+' ? gmtHours : -gmtHours;
    const realGmtMinutes = gmtSign === '+' ? gmtMinutes : -gmtMinutes;

    // check if numberOfPolls is valid number
    const number = parseInt(numberOfPolls, 10);
    if (Number.isNaN(number) || number < 1 || number > 20) {
      await interaction.reply({
        content: 'Please enter a valid number of polls.',
        ephemeral: true,
      });
      return;
    }

    // for strange oracle server timezone
    hours -= 18;

    // date with hours
    const dateWithHours = new Date(date);
    dateWithHours.setHours(hours + realGmtHours, realGmtMinutes, 0, 0);

    const listContents = pollEmojiArray
      .slice(0, numberOfPolls)
      .map(
        (emoji, index) =>
          `${emoji} <t:${(dateWithHours.getTime() + 3600000 * index).toString().slice(0, 10)}:F>`,
      )
      .join('\n');

    const content = `${messageContent}\n
    ${listContents}`;
    const embed = {
      color: 0x65a69e,
      description: content,
    };

    const message = await interaction.channel.send({
      embeds: [embed],
    });

    pollEmojiArray.slice(0, numberOfPolls).forEach((emoji) => message.react(emoji));

    await interaction.reply({
      content: 'Poll has been generated. (This message will be deleted in 10 seconds))',
      ephemeral: true,
    });

    setTimeout(async () => {
      await interaction.deleteReply();
    }, 10000);
  }
});

client.login(config.DISCORD_TOKEN);
