import { SlashCommandBuilder } from 'discord.js';
import checkPomodoroStatus from '../../service/interaction/is-chat-input-command/check-pomodoro-status.js';

export default {
  data: new SlashCommandBuilder()
    .setName('check-pomodoro-status')
    .setDescription('Check the pomodoro status.'),

  async execute(interaction) {
    checkPomodoroStatus(interaction);
  },
};
