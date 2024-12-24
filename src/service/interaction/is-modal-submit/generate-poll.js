import { time } from 'discord.js';
import pollEmojiArray from '../../../data/poll-emoji-array.js';

export default async (interaction) => {
  const messageContent = interaction.fields.getTextInputValue('messageContent');
  const startDate = interaction.fields.getTextInputValue('startDate');
  const startHours = interaction.fields.getTextInputValue('startHours');
  const utc = interaction.fields.getTextInputValue('utc');
  const numberOfPolls = interaction.fields.getTextInputValue('numberOfPolls');

  // check if startDate is valid date
  const date = new Date(
    `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`,
  );
  if (Number.isNaN(date.getTime())) {
    await interaction.reply({
      content: 'Please enter a valid date.',
      ephemeral: true,
    });
    return;
  }

  // check if startHours is valid hours
  const hours = parseInt(startHours, 10);
  if (Number.isNaN(hours) || hours < 0 || hours > 23) {
    await interaction.reply({
      content: 'Please enter a valid hours.',
      ephemeral: true,
    });
    return;
  }

  // check if utc is valid +/-HH:MM
  const utcHours = parseInt(utc.slice(1, 3), 10);
  const utcMinutes = parseInt(utc.slice(4, 6), 10);
  const utcSign = utc[0];
  if ((utcSign !== '+' && utcSign !== '-') || Number.isNaN(utcHours) || Number.isNaN(utcMinutes)) {
    await interaction.reply({
      content: 'Please enter a valid utc.',
      ephemeral: true,
    });
    return;
  }

  const realUtcHours = utcSign === '+' ? utcHours : -utcHours;
  const realUtcMinutes = utcSign === '+' ? utcMinutes : -utcMinutes;

  // check if numberOfPolls is valid number
  const number = parseInt(numberOfPolls, 10);
  if (Number.isNaN(number) || number < 1 || number > 20) {
    await interaction.reply({
      content: 'Please enter a valid number of polls.',
      ephemeral: true,
    });
    return;
  }

  // date with hours
  const dateWithHours = new Date(date);
  dateWithHours.setHours(hours - realUtcHours, -realUtcMinutes, 0, 0);

  const listContents = pollEmojiArray
    .slice(0, numberOfPolls)
    .map(
      (emoji, index) =>
        `${emoji} ${time(
          +(dateWithHours.getTime() + 3600000 * index).toString().slice(0, 10),
          'F',
        )}`,
    )
    .join('\n');

  const content = `${messageContent}\n${listContents}`;

  const embed = {
    color: 0xc3c3e5,
    description: content,
  };

  const message = await interaction.channel.send({
    embeds: [embed],
  });

  pollEmojiArray.slice(0, numberOfPolls).forEach((emoji) => message.react(emoji).catch(() => {}));

  await interaction.reply({
    content: 'Poll has been generated.\n\n**This message will be deleted in 10 seconds.**',
    ephemeral: true,
  });

  setTimeout(async () => {
    await interaction.deleteReply();
  }, 10000);
};
