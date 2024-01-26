import schedule from 'node-schedule';
import { userMention } from 'discord.js';
import client from '../client/index.js';
import config from '../config/index.js';

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
        console.error('last message is not from this bot');
        return;
      }

      const { createdTimestamp, content: lastMessageContent } = lastMessage;
      const now = Date.now();

      const diff = now - createdTimestamp;

      // 23 hours 59 minutes
      if (diff >= 1000 * 60 * 60 * 24 - 1000 * 60) {
        const contentUserId = lastMessageContent.match(/<@(\d+)>/)[1];

        console.log(`${contentUserId} needs to be blocked for few days`);
        // TODO: block the skipped user for few days (store it in persistent storage maybe redis)

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

        const distinctCurrentMessagesAuthorIdArray = [...new Set(currentMessagesAuthorIdArray)];

        distinctCurrentMessagesAuthorIdArray.forEach((currentAuthorId) => {
          if (reactedUserIdArray.includes(currentAuthorId)) {
            reactedUserIdArray.splice(reactedUserIdArray.indexOf(currentAuthorId), 1);
          }
        });

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
