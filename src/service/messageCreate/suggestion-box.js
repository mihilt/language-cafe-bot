export default async (message) => {
  await message.channel.threads.create({
    name: 'New Thread',
    // seven days
    autoArchiveDuration: 10080,
    startMessage: message.id,
  });

  const plusOneEmoji = '783705863381975070';
  const minusOneEmoji = '783705940230144001';

  if (
    !message.guild.emojis.cache.has(plusOneEmoji) ||
    !message.guild.emojis.cache.has(minusOneEmoji)
  ) {
    return;
  }

  await message.react(plusOneEmoji).catch(() => {});
  await message.react(minusOneEmoji).catch(() => {});
};
