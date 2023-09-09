import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('register-exchange-partner-list')
    .setTitle('Register exchange partner list');

  const targetLanguage = new TextInputBuilder()
    .setCustomId('targetLanguage')
    .setLabel("Put target language's flag emoji.")
    .setPlaceholder('ex: 🇰🇷🇯🇵')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(40);

  const offerLanguage = new TextInputBuilder()
    .setCustomId('offerLanguage')
    .setLabel("Put offer language's flag emoji.")
    .setPlaceholder('ex: 🇺🇸🇪🇸')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(40);

  const introduction = new TextInputBuilder()
    .setCustomId('introduction')
    .setLabel('Put your introduction.')
    .setPlaceholder(
      "I'm looking for language exchange partners to learn Korean and Japanese.\nI can teach you English ...",
    )
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(10)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(targetLanguage),
    new ActionRowBuilder().addComponents(offerLanguage),
    new ActionRowBuilder().addComponents(introduction),
  );

  await interaction.showModal(modal);
};
