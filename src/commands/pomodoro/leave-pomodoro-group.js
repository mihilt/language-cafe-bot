import { SlashCommandBuilder } from 'discord.js';
import leavePomodoroGroup from '../../service/interaction/is-chat-input-command/leave-pomodoro-group.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leave-pomodoro-group')
    .setDescription('Leave a pomodoro group.'),
  async execute(interaction) {
    leavePomodoroGroup(interaction);
  },
};
