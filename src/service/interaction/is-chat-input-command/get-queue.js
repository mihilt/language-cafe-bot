import Queue from '../../../models/queue.js';

export const getCurrentQueueDescription = async () => {
  let queueMessage = '### Current Queue\n\n';

  try {
    const queueRes = await Queue.find().sort({ createdAt: 1 });

    if (queueRes.length === 0) {
      queueMessage = 'The queue is empty';
    } else {
      queueMessage += `Now on: <@${queueRes[0].id}>`;
    }
    if (queueRes.length > 1) {
      queueMessage += `\n\nUp next:\n${queueRes
        .slice(1)
        .map((q, i) => `${i}. <@${q.id}>`)
        .join('\n')}`;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  return queueMessage;
};

export default async (interaction) => {
  try {
    const description = await getCurrentQueueDescription();

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
