import Queue from '../../../models/queue.js';

export default async (interaction) => {
  try {
    await Queue.deleteMany({});

    interaction.reply({
      embeds: [
        {
          color: 0xc3c3e5,
          description: 'Queue has been reset.',
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
