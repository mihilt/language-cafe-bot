import { Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import client from './client/index.js';
import config from './config/index.js';
import keyv from './db/keyv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

client.login(config.DISCORD_TOKEN);
