export default async (message) => {
  await message.channel.threads.create({
    name: 'New Thread',
    // seven days
    autoArchiveDuration: 10080,
    startMessage: message.id,
  });

  await message.react('783705863381975070');
  await message.react('783705940230144001');
};
