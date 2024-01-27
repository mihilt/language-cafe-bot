import schedule from 'node-schedule';
import { userMention } from 'discord.js';
import client from '../client/index.js';
import config from '../config/index.js';
import SkippedPassTheCoffeeCupUser from '../models/skipped-pass-the-coffee-cup-user.js';

const {
  PASS_THE_COFFEE_CUP_CHANNEL_ID: passTheCoffeeCupChannelId,
  PASS_THE_COFFEE_CUP_ENROLLMENT_MESSAGE_ID: enrollmentMessageId,
  CLIENT_ID: clientId,
} = config;

export default function schedules() {
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      const passTheCoffeeCupChannel = await client.channels.cache.get(passTheCoffeeCupChannelId);

      const messages = await passTheCoffeeCupChannel?.messages.fetch({
        limit: 1,
      });

      const lastMessage = messages.first();

      if (!lastMessage) return;

      if (lastMessage.author.id !== clientId) {
        throw new Error('last message is not from this bot');
      }

      const { createdTimestamp, content: lastMessageContent } = lastMessage;
      const now = Date.now();

      const diff = now - createdTimestamp;

      // 23 hours 59 minutes
      if (diff >= 1000 * 60 * 60 * 24 - 1000 * 60) {
        const contentUserId = lastMessageContent.match(/<@(\d+)>/)[1];

        if (!contentUserId) {
          throw new Error('contentUserId is not found');
        }

        const findOneAndUpdateRes = await SkippedPassTheCoffeeCupUser.findOneAndUpdate(
          { id: contentUserId },
          { id: contentUserId },
          { upsert: true, new: true },
        );

        if (!findOneAndUpdateRes) {
          throw new Error('SkippedPassTheCoffeeCupUser.findOneAndUpdate() failed');
        }

        const enrollmentMessage = await passTheCoffeeCupChannel.messages.fetch(enrollmentMessageId);

        const reactedUsersPromise = enrollmentMessage.reactions.cache.map((reaction) =>
          reaction.users.fetch(),
        );

        const reactedUsersCollection = await Promise.all(reactedUsersPromise);

        const reactedUserIdArray = reactedUsersCollection
          .map((userCollection) => userCollection.map((user) => user.id))
          .flat();

        const currentMessages = await passTheCoffeeCupChannel.messages.fetch({
          limit: reactedUserIdArray.length,
        });

        const currentMessagesAuthorIdArray = currentMessages.map((currentMessage) =>
          currentMessage.author.id === clientId
            ? currentMessage.content.match(/<@(\d+)>/)[1]
            : currentMessage.author.id,
        );

        const currentSkippedPassTheCoffeeCupUser = await SkippedPassTheCoffeeCupUser.find({
          updatedAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        });

        const currentSkippedPassTheCoffeeCupUserIdArray = currentSkippedPassTheCoffeeCupUser.map(
          (user) => user.id,
        );

        const idsToExcludeArray = [
          ...new Set([
            ...currentMessagesAuthorIdArray,
            ...currentSkippedPassTheCoffeeCupUserIdArray,
          ]),
        ];

        idsToExcludeArray.forEach((idToExclude) => {
          if (reactedUserIdArray.includes(idToExclude)) {
            reactedUserIdArray.splice(reactedUserIdArray.indexOf(idToExclude), 1);
          }
        });

        if (reactedUserIdArray.length === 0) {
          throw new Error('filtered reactedUserIdArray is empty');
        }

        const randomUserId =
          reactedUserIdArray[Math.floor(Math.random() * reactedUserIdArray.length)];

        const content = `${userMention(randomUserId)} pass the coffee cup!`;

        await lastMessage.delete();

        await passTheCoffeeCupChannel.send(content);
      }
    } catch (error) {
      console.error(error);
    }
  });
}
