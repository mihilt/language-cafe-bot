import { userMention } from 'discord.js';
import config from '../../config/index.js';

const { PASS_THE_COFFEE_CUP_ENROLLMENT_MESSAGE_ID: enrollmentMessageId } = config;

export default async (message) => {
  const enrollmentMessage = await message.channel.messages.fetch(enrollmentMessageId);
  const usersPromise = enrollmentMessage.reactions.cache.map((reaction) => reaction.users.fetch());

  const usersCollection = await Promise.all(usersPromise);

  const userIdArray = usersCollection
    .map((userCollection) => userCollection.map((user) => user.id))
    .flat();

  const randomUserId = userIdArray[Math.floor(Math.random() * userIdArray.length)];

  const content = `${userMention(randomUserId)} pass the coffee cup!`;

  await message.reply(content);
};
