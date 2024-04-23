import { SlashCommandBuilder } from 'discord.js';
import registerStudyBuddyList from '../../service/interaction/is-chat-input-command/register-my-study-buddy-listing.js';

export default {
  data: new SlashCommandBuilder()
    .setName('register-my-study-buddy-listing')
    .setDescription('Register study buddy listing'),

  async execute(interaction) {
    registerStudyBuddyList(interaction);
  },
};
