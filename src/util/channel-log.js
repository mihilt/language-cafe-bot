import client from '../client/index.js';
import config from '../config/index.js';

const { LOG_SERVER_ID: logServerId, LOG_CHANNEL_ID: logChannelId } = config;

export default (content) => {
  client.guilds.cache
    .get(logServerId)
    .channels.cache.get(logChannelId)
    .send({
      embeds: [
        {
          description: content,
        },
      ],
    });
};

export const generateInteractionCreateLogContent = (interaction, additionalMessage) =>
  `### Interaction Message\ntime: <t:${Date.now().toString().slice(0, 10)}:F>\nserver: ${
    interaction.guild.name
  }\nchannel: \`#${interaction.channel.name}\`\ncommand: \`/${interaction.commandName}\`\nuser: <@${
    interaction.user.id
  }>${additionalMessage ? `\n\`\`\`${additionalMessage}\`\`\`` : ''}`;

export const generateMessageCreateLogContent = (message, additionalMessage) =>
  `### Create Message\ntime: <t:${Date.now().toString().slice(0, 10)}:F>\nserver: ${
    message.guild.name
  }\nchannel: \`#${message.channel.name}\`\nuser: <@${message.author.id}>
${additionalMessage ? `\n\`\`\`${additionalMessage}\`\`\`` : ''}`;
