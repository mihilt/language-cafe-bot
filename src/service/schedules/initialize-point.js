import config from '../../config/index.js';
import client from '../../client/index.js';
import Point, { getTotalPoints } from '../../models/point.js';

const {
  POINTS_LEADERBOARD_COMMAND_ID: pointsLeaderboardCommandId,
  DEV_TEAM_CHANNEL_ID: devTeamChannelId,
} = config;

const initializePoint = async () => {
  try {
    const channel = await client.channels.fetch(devTeamChannelId);
    const pointRes = await Point.find();

    if (pointRes.length === 0) {
      await channel.send({
        embeds: [
          {
            color: 0x65a69e,
            description: 'There are no points yet',
          },
        ],
      });

      return;
    }

    const refinedAndSortedPointRes = pointRes
      .map((point) => ({
        id: point.id,
        totalPoints: getTotalPoints(point),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const refinedBestUserData = refinedAndSortedPointRes[0];
    const originalBestUserData = pointRes.find((point) => point.id === refinedBestUserData.id);

    const description = `## Points Leaderboard (Top 10)\n${
      refinedAndSortedPointRes
        .slice(0, 10)
        .map(
          (point, index) =>
            `**${index + 1}.** <@${point.id}> (Points: **${point.totalPoints?.toLocaleString()}**)`,
        )
        .join('\n') || 'There are no points yet.'
    }\n\n${
      originalBestUserData
        ? `## The user with the highest points is <@${originalBestUserData.id}>\n\ncategories: \`${
            originalBestUserData.categories?.toLocaleString() || 0
          }\`\ncounting: \`${
            originalBestUserData.counting?.toLocaleString() || 0
          }\`\nemoji-blend: \`${
            originalBestUserData.emojiBlend?.toLocaleString() || 0
          }\`\nletter-change: \`${
            originalBestUserData.letterChange?.toLocaleString() || 0
          }\`\nmatch-match: \`${
            originalBestUserData.matchMatch?.toLocaleString() || 0
          }\`\npass-the-coffee-cup: \`${
            originalBestUserData.passTheCoffeeCup?.toLocaleString() || 0
          }\`\nshiritori: \`${
            originalBestUserData.shiritori?.toLocaleString() || 0
          }\`\n\n**Total Points: ${getTotalPoints(originalBestUserData)?.toLocaleString()}**`
        : ''
    }\n\n### How to see my current points: </points-leaderboard:${pointsLeaderboardCommandId}>`;

    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description,
        },
      ],
    });

    await Point.deleteMany();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export default initializePoint;
