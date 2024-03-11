import { SlashCommandBuilder } from 'discord.js';
import createNewPomodoroStudyGroup from '../../service/interaction/is-chat-input-command/create-pomodoro-group.js';

export default {
  data: new SlashCommandBuilder()
    .setName('create-pomodoro-group')
    .setDescription('Create a new pomodoro study group')
    .addStringOption((option) =>
      option
        .setName('group-name')
        .setMaxLength(15)
        .setDescription('Type study group name (click timer-pattern when done)')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('timer-pattern')
        .setMaxLength(20)
        .setDescription('The study/break timer pattern (ex: 25/5/15/10/30/30)')
        .setRequired(true),
    ),

  async execute(interaction) {
    createNewPomodoroStudyGroup(interaction);
  },
};
