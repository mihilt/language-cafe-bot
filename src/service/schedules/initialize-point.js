import config from '../../config/index.js';
import client from '../../client/index.js';
import Point, { getTotalPoints } from '../../models/point.js';

const {
  POINTS_LEADERBOARD_COMMAND_ID: pointsLeaderboardCommandId,
  CAFE_ANNOUNCEMENTS_CHANNEL_ID: cafeAnnouncementsChannelId,
} = config;

const initializePoint = async () => {
  try {
    const channel = await client.channels.fetch(cafeAnnouncementsChannelId);
    const pointRes = await Point.find();

    if (pointRes.length === 0) {
      await channel.send({
        embeds: [
          {
            color: 0xc3c3e5,
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

    const bestUser = await client.users.fetch(originalBestUserData.id);

    const thisMonthDescription = `### This Month's Word Games Point Result\nThe winner is ${`<@${originalBestUserData.id}>`} with ${
      getTotalPoints(originalBestUserData)?.toLocaleString() || 0
    } points!`;

    const LeaderboardDescription = `## Points Leaderboard (Top 10)\n${
      refinedAndSortedPointRes
        .slice(0, 10)
        .map(
          (point, index) =>
            `**${index + 1}.** <@${point.id}> (Points: **${point.totalPoints?.toLocaleString()}**)`,
        )
        .join('\n') || 'There are no points yet.'
    }\n\nHow to see my current points: </word-games-point-leaderboard:${pointsLeaderboardCommandId}>`;

    await channel.send({
      embeds: [
        {
          color: 0xc3c3e5,
          description: thisMonthDescription,
          thumbnail: {
            url: bestUser.avatarURL(),
          },
        },
      ],
    });

    await channel.send({
      embeds: [
        {
          color: 0xc3c3e5,
          description: LeaderboardDescription,
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
