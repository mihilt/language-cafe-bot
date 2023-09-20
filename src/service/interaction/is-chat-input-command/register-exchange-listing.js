import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('register-exchange-listing')
    .setTitle('Register exchange partner list');

  const targetLanguage = new TextInputBuilder()
    .setCustomId('targetLanguage')
    .setLabel('Put target languages')
    .setPlaceholder('ex: Korean, Japanese')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100);

  const offeredLanguage = new TextInputBuilder()
    .setCustomId('offeredLanguage')
    .setLabel('Put offered languages')
    .setPlaceholder('ex: English, Spanish')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100);

  const introduction = new TextInputBuilder()
    .setCustomId('introduction')
    .setLabel('Put your introduction.')
    .setPlaceholder(
      "I'm looking for language exchange partners to learn Korean and Japanese.\nI can teach you English ...",
    )
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(targetLanguage),
    new ActionRowBuilder().addComponents(offeredLanguage),
    new ActionRowBuilder().addComponents(introduction),
  );

  await interaction.showModal(modal);
};
