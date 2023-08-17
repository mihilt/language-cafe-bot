import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on('ready', () => {
  console.log(`\nLogged in as ${client.user.tag}!\n`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(message);

  if (message.content === 'ping') {
    await message.reply('pong');
  }
});

client.login(process.env.DISCORD_TOKEN);
