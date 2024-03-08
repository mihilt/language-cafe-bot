import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.info(`Ready! Logged in as ${client.user.tag}`);
  },
};
