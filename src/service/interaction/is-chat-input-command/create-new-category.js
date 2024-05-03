import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('create-new-category')
    .setTitle('Create new category');

  const message = new TextInputBuilder()
    .setCustomId('message')
    .setLabel('Put message content')
    .setStyle(TextInputStyle.Paragraph);

  const exceptedLetters = new TextInputBuilder()
    .setRequired(false)
    .setCustomId('excepted-letters')
    .setLabel('Put excepted letters')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('QXVZ')
    .setValue('QXVZ');

  modal.addComponents(
    new ActionRowBuilder().addComponents(message),
    new ActionRowBuilder().addComponents(exceptedLetters),
  );

  await interaction.showModal(modal);
};
