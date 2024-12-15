import { userMention } from 'discord.js';
import client from '../../client/index.js';
import config from '../../config/index.js';
import SkippedPassTheCoffeeCupUser from '../../models/skipped-pass-the-coffee-cup-user.js';

const {
  PASS_THE_COFFEE_CUP_CHANNEL_ID: passTheCoffeeCupChannelId,
  PASS_THE_COFFEE_CUP_ENROLLMENT_MESSAGE_ID: enrollmentMessageId,
  CLIENT_ID: clientId,
} = config;

const checkIfPassTheCoffeeCupLastMessageIsValid = async () => {
  try {
    const passTheCoffeeCupChannel = await client.channels.cache.get(passTheCoffeeCupChannelId);

    const messages = await passTheCoffeeCupChannel?.messages.fetch({
      limit: 10,
    });

    const lastBotMessage = messages.find((msg) => msg.author.id === clientId);

    if (!lastBotMessage) {
      throw new Error('lastBotMessage is not found');
    }

    const { createdTimestamp, content: lastBotMessageContent } = lastBotMessage;
    const now = Date.now();

    const diff = now - createdTimestamp;

    // 23 hours 59 minutes
    if (diff >= 24 * 59 * 60 * 1000) {
      const lastMentionedUserId = lastBotMessageContent.match(/<@(\d+)>/)[1];

      if (!lastMentionedUserId) {
        throw new Error('lastMentionedUserId is not found');
      }

      const findOneAndUpdateRes = await SkippedPassTheCoffeeCupUser.findOneAndUpdate(
        { id: lastMentionedUserId },
        { id: lastMentionedUserId },
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

      const leftUsers = reactedUserIdArray.filter(
        (userId) => !passTheCoffeeCupChannel.guild.members.cache.has(userId),
      );

      const currentSkippedPassTheCoffeeCupUser = await SkippedPassTheCoffeeCupUser.find();

      const currentSkippedPassTheCoffeeCupUserIdArray = currentSkippedPassTheCoffeeCupUser.map(
        (user) => user.id,
      );

      const currentMessages = await passTheCoffeeCupChannel.messages.fetch({
        limit:
          reactedUserIdArray.length -
          leftUsers.length -
          currentSkippedPassTheCoffeeCupUserIdArray.length,
      });

      const currentMessagesAuthorIdArray = currentMessages.map((currentMessage) =>
        currentMessage.author.id === clientId
          ? currentMessage.content.match(/<@(\d+)>/)[1]
          : currentMessage.author.id,
      );

      const idsToExcludeArray = [
        ...new Set([
          ...currentMessagesAuthorIdArray,
          ...currentSkippedPassTheCoffeeCupUserIdArray,
          lastMentionedUserId,
          ...leftUsers,
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

      const skippedContentList = [
        'didn’t pass the coffee cup!',
        'dropped the coffee cup!',
        'spilled the coffee cup!',
        'misplaced the coffee cup!',
        'took an extended coffee break!',
      ];

      const editedLastBotMessageContent = `${userMention(lastMentionedUserId)} ${
        skippedContentList[Math.floor(Math.random() * skippedContentList.length)]
      }`;

      await lastBotMessage.edit(editedLastBotMessageContent).catch(() => {});

      await lastBotMessage.react('😭').catch(() => {});

      const repliedMessage = await lastBotMessage.fetchReference().catch(() => {});

      const content = `${userMention(randomUserId)} pass the coffee cup!`;

      if (repliedMessage) {
        await repliedMessage.reply({
          content,
          allowedMentions: {
            repliedUser: false,
            users: [randomUserId],
          },
        });
      } else {
        await passTheCoffeeCupChannel.send(content);
      }

      const lastMentionUserReaction = enrollmentMessage.reactions.cache.filter((reaction) =>
        reaction.users.cache.has(lastMentionedUserId),
      );

      for (const reaction of lastMentionUserReaction.values()) {
        await reaction.users.remove(lastMentionedUserId);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export default checkIfPassTheCoffeeCupLastMessageIsValid;
