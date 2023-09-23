import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default async (interaction) => {
  const modal = new ModalBuilder().setCustomId('generate-poll').setTitle('Generate a poll');

  const messageContent = new TextInputBuilder()
    .setCustomId('messageContent')
    .setPlaceholder("Put message's content.")
    .setLabel("Put message's content.")
    .setStyle(TextInputStyle.Paragraph);

  const startDate = new TextInputBuilder()
    .setCustomId('startDate')
    .setLabel('Put start date. format: YYYYMMDD')
    .setPlaceholder('20230101')
    .setStyle(TextInputStyle.Short)
    .setMinLength(8)
    .setMaxLength(8);

  const startHours = new TextInputBuilder()
    .setCustomId('startHours')
    .setLabel('Put start hours. format: HH (24 hours)')
    .setPlaceholder('23')
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(2);

  const utc = new TextInputBuilder()
    .setCustomId('utc')
    .setLabel('Put utc. format: +/-HH:MM')
    .setPlaceholder('+09:00')
    .setValue('-05:00')
    .setStyle(TextInputStyle.Short)
    .setMinLength(6)
    .setMaxLength(6);

  const numberOfPolls = new TextInputBuilder()
    .setCustomId('numberOfPolls')
    .setLabel('Put number of polls. (1~20)')
    .setPlaceholder('10')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(2);

  modal.addComponents(
    new ActionRowBuilder().addComponents(messageContent),
    new ActionRowBuilder().addComponents(startDate),
    new ActionRowBuilder().addComponents(startHours),
    new ActionRowBuilder().addComponents(utc),
    new ActionRowBuilder().addComponents(numberOfPolls),
  );

  await interaction.showModal(modal);
};
