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
    const passTheCoffeeCupChannel = await client.channels.cache.get(passTheCoffeeCupChannelId);

    const lastMessage = await passTheCoffeeCupChannel?.messages.fetch({
      limit: 1,
    });

    if (!lastMessage) return;

    const { createdTimestamp, content: lastMessageContent } = lastMessage.first();
    const now = Date.now();

    const diff = now - createdTimestamp;

    if (diff >= 1000 * 60 * 60 * 24) {
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

      await passTheCoffeeCupChannel.send(content);
    }
  });
}
