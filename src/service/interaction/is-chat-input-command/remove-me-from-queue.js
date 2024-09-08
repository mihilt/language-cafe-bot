import config from '../../../config/index.js';
import Queue from '../../../models/queue.js';
import { getCurrentQueueDescription } from './get-queue.js';

export default async (interaction) => {
  try {
    const userId = interaction.user.id;
    const { channel } = interaction;

    const isExist = await Queue.findOne({ id: userId });

    if (!isExist) {
      interaction.reply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'You are not in the queue.',
          },
        ],
        ephemeral: true,
      });
      return;
    }

    await Queue.deleteOne({ id: userId });

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: `You have been removed from the queue.\nFeel free to rejoin at any time using </add-me-to-queue:${config.ADD_ME_TO_QUEUE_COMMAND_ID}>.`,
        },
      ],
      ephemeral: true,
    });

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          footer: {
            icon_url: interaction.user.avatarURL(),
            text: `${interaction.user.globalName}(${interaction.user.username}#${interaction.user.discriminator}) has been removed from the queue.`,
          },
        },
      ],
    });

    const currentQueueDescription = await getCurrentQueueDescription();

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: currentQueueDescription,
        },
      ],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
