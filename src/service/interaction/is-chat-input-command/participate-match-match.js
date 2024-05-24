import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import MatchMatchMessage from '../../../models/match-match-message.js';

export default async (interaction) => {
  const matchMatchMessage = await MatchMatchMessage.findOne({
    id: interaction.user.id,
  });

  const modal = new ModalBuilder()
    .setCustomId('participate-match-match')
    .setTitle('Participate in match-match');

  const submissionInTargetLanguage = new TextInputBuilder()
    .setCustomId('submissionInTargetLanguage')
    .setLabel('Put a submission in target language')
    .setValue(matchMatchMessage?.submissionInTargetLanguage || '')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(100);

  const submission = new TextInputBuilder()
    .setCustomId('submission')
    .setLabel('Put a submission in English')
    .setValue(matchMatchMessage?.submission || '')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(100);

  modal.addComponents(
    new ActionRowBuilder().addComponents(submissionInTargetLanguage),
    new ActionRowBuilder().addComponents(submission),
  );

  await interaction.showModal(modal);
};
