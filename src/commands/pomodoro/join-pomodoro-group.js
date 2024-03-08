import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import joinPomodoroGroup from '../../service/interaction/is-chat-input-command/join-pomodoro-group.js';

export default {
  data: new SlashCommandBuilder()
    .setName('join-pomodoro-group')
    .setDescription('Join a pomodoro group.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    joinPomodoroGroup(interaction);
  },
};
