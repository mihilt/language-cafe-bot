import Point from '../../../models/point.js';
import channelLog, { generateInteractionCreateLogContent } from '../../utils/channel-log.js';

const getTotalPoints = ({
  categories = 0,
  counting = 0,
  emojiBlend = 0,
  letterChange = 0,
  matchMatch = 0,
  passTheCoffeeCup = 0,
  shiritori = 0,
}) => categories + counting + emojiBlend + letterChange + matchMatch + passTheCoffeeCup + shiritori;

export default async (interaction) => {
  try {
    channelLog(generateInteractionCreateLogContent(interaction));

    await interaction.deferReply({
      ephemeral: true,
    });

    const pointRes = await Point.find({});

    if (pointRes.length === 0) {
      await interaction.editReply({
        embeds: [
          {
            color: 0x65a69e,
            description: 'There are no points yet.',
          },
        ],
        ephemeral: true,
      });
      return;
    }

    const refinedAndSortedPointRes = pointRes
      .map((point) => ({
        id: point.id,
        totalPoints: getTotalPoints(point),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const myPoint = pointRes.find((point) => point.id === interaction.user.id);
    const myRank =
      refinedAndSortedPointRes.findIndex((point) => point.id === interaction.user.id) + 1;

    const description = `## Points Leaderboard (Top 10)\n${
      refinedAndSortedPointRes
        .slice(0, 10)
        .map(
          (point, index) =>
            `**${index + 1}.** <@${point.id}> (Points: **${point.totalPoints?.toLocaleString()}**)`,
        )
        .join('\n') || 'There are no points yet.'
    }\n\n${
      myPoint
        ? `<@${
            interaction.user.id
          }>, you are rank #**${myRank}**\n## Individual Game Point Breakdown\n\ncategories: \`${
            myPoint.categories?.toLocaleString() || 0
          }\`\ncounting: \`${myPoint.counting?.toLocaleString() || 0}\`\nemoji-blend: \`${
            myPoint.emojiBlend?.toLocaleString() || 0
          }\`\nletter-change: \`${myPoint.letterChange?.toLocaleString() || 0}\`\nmatch-match: \`${
            myPoint.matchMatch?.toLocaleString() || 0
          }\`\npass-the-coffee-cup: \`${
            myPoint.passTheCoffeeCup?.toLocaleString() || 0
          }\`\nshiritori: \`${
            myPoint.shiritori?.toLocaleString() || 0
          }\`\n\n**Total Points: ${getTotalPoints(myPoint)?.toLocaleString()}**`
        : ''
    }`;

    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description,
        },
      ],
      ephemeral: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
