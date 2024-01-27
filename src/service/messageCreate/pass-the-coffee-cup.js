import { userMention } from 'discord.js';
import config from '../../config/index.js';
import SkippedPassTheCoffeeCupUser from '../../models/skipped-pass-the-coffee-cup-user.js';

const {
  PASS_THE_COFFEE_CUP_ENROLLMENT_MESSAGE_ID: passTheCoffeeCupChannelId,
  CLIENT_ID: clientId,
} = config;

export default async (message) => {
  try {
    const messageAuthorId = message.author.id;

    const enrollmentMessage = await message.channel.messages.fetch(passTheCoffeeCupChannelId);
    const reactedUsersPromise = enrollmentMessage.reactions.cache.map((reaction) =>
      reaction.users.fetch(),
    );

    const reactedUsersCollection = await Promise.all(reactedUsersPromise);

    const reactedUserIdArray = reactedUsersCollection
      .map((userCollection) => userCollection.map((user) => user.id))
      .flat();

    const currentMessages = await message.channel.messages.fetch({
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
        messageAuthorId,
      ]),
    ];

    idsToExcludeArray.forEach((idToExclude) => {
      if (reactedUserIdArray.includes(idToExclude)) {
        reactedUserIdArray.splice(reactedUserIdArray.indexOf(idToExclude), 1);
      }
    });

    const randomUserId = reactedUserIdArray[Math.floor(Math.random() * reactedUserIdArray.length)];

    const content = `${userMention(randomUserId)} pass the coffee cup!`;

    await message.reply(content);
  } catch (error) {
    console.error(error);
  }
};
