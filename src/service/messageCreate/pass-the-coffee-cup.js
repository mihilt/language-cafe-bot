import { userMention } from 'discord.js';
import config from '../../config/index.js';

const { PASS_THE_COFFEE_CUP_ENROLLMENT_MESSAGE_ID: enrollmentMessageId } = config;

export default async (message) => {
  const messageAuthorId = message.author.id;

  const enrollmentMessage = await message.channel.messages.fetch(enrollmentMessageId);
  const reactedUsersPromise = enrollmentMessage.reactions.cache.map((reaction) =>
    reaction.users.fetch(),
  );

  const reactedUsersCollection = await Promise.all(reactedUsersPromise);

  const reactedUserIdArray = reactedUsersCollection
    .map((userCollection) => userCollection.map((user) => user.id))
    .flat();

  if (reactedUserIdArray.includes(messageAuthorId)) {
    reactedUserIdArray.splice(reactedUserIdArray.indexOf(message.author.id), 1);
  } else {
    return;
  }

  const currentMessages = await message.channel.messages.fetch({
    limit: reactedUserIdArray.length,
  });

  const currentMessagesAuthorIdArray = currentMessages
    .filter((currentMessage) => !currentMessage.author.bot)
    .map((currentMessage) => currentMessage.author.id);

  if (currentMessagesAuthorIdArray.includes(messageAuthorId)) {
    currentMessagesAuthorIdArray.splice(currentMessagesAuthorIdArray.indexOf(message.author.id), 1);
  }

  const distinctCurrentMessagesAuthorIdArray = [...new Set(currentMessagesAuthorIdArray)];

  distinctCurrentMessagesAuthorIdArray.forEach((currentAuthorId) => {
    if (reactedUserIdArray.includes(currentAuthorId)) {
      reactedUserIdArray.splice(reactedUserIdArray.indexOf(currentAuthorId), 1);
    }
  });

  const currentMentionedUserIdArray = currentMessages
    .filter((currentMessage) => currentMessage.author.bot)
    .map((currentMessage) => currentMessage.content.match(/<@(\d+)>/)[1]);

  if (currentMentionedUserIdArray.includes(messageAuthorId)) {
    currentMentionedUserIdArray.splice(currentMentionedUserIdArray.indexOf(message.author.id), 1);
  }

  const distinctCurrentMentionedUserIdArray = [...new Set(currentMentionedUserIdArray)];

  distinctCurrentMentionedUserIdArray.forEach((currentMentionedUserId) => {
    if (reactedUserIdArray.includes(currentMentionedUserId)) {
      reactedUserIdArray.splice(reactedUserIdArray.indexOf(currentMentionedUserId), 1);
    }
  });

  const randomUserId = reactedUserIdArray[Math.floor(Math.random() * reactedUserIdArray.length)];

  const content = `${userMention(randomUserId)} pass the coffee cup!`;

  await message.reply(content);
};
