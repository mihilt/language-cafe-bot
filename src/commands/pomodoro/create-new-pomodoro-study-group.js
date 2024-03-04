import { SlashCommandBuilder } from 'discord.js';
import createNewPomodoroStudyGroup from '../../service/interaction/is-chat-input-command/create-new-pomodoro-study-group.js';

export default {
  data: new SlashCommandBuilder()
    .setName('create-new-pomodoro-study-group')
    .setDescription('Create a new pomodoro study group')
    .addStringOption((option) =>
      option
        .setName('group-name')
        .setMaxLength(20)
        .setDescription('The group name')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('study-time').setDescription('The study time').setRequired(true),
    ),
  async execute(interaction) {
    createNewPomodoroStudyGroup(interaction);
  },
};
