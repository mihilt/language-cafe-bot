import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default async (interaction) => {
  const modal = new ModalBuilder().setCustomId('generate-poll').setTitle('Generate a poll');

  const messageContent = new TextInputBuilder()
    .setCustomId('messageContent')
    .setLabel("Put message's content.")
    .setStyle(TextInputStyle.Paragraph);

  const startDate = new TextInputBuilder()
    .setCustomId('startDate')
    .setLabel('Put start date. format: YYYYMMDD')
    .setStyle(TextInputStyle.Short)
    .setMinLength(8)
    .setMaxLength(8);

  const startHours = new TextInputBuilder()
    .setCustomId('startHours')
    .setLabel('Put start hours. format: HH (24 hours)')
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(2);

  const gmt = new TextInputBuilder()
    .setCustomId('gmt')
    .setLabel('Put gmt. format: +/-HH:MM')
    .setStyle(TextInputStyle.Short)
    .setMinLength(6)
    .setMaxLength(6);

  const numberOfPolls = new TextInputBuilder()
    .setCustomId('numberOfPolls')
    .setLabel('Put number of polls. (1~20)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(2);

  modal.addComponents(
    new ActionRowBuilder().addComponents(messageContent),
    new ActionRowBuilder().addComponents(startDate),
    new ActionRowBuilder().addComponents(startHours),
    new ActionRowBuilder().addComponents(gmt),
    new ActionRowBuilder().addComponents(numberOfPolls),
  );

  await interaction.showModal(modal);
};
