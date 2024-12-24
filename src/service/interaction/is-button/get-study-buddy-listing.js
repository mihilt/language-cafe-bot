import { ActionRowBuilder, ButtonBuilder, ButtonStyle, time, userMention } from 'discord.js';
import client from '../../../client/index.js';
import StudyBuddy from '../../../models/study-buddy.js';

export default async (interaction) => {
  const clientData = await StudyBuddy.findOne(
    {
      id: interaction.user.id,
    },
    { targetLanguage: 1, level: 1, _id: 0 },
  );

  if (!clientData) {
    await interaction.update({
      embeds: [
        {
          color: 0xc3c3e5,
          title: 'Get Study Buddy Listings',
          description: `${userMention(
            interaction.user.id,
          )}, you have not registered your study buddy listing yet.`,
        },
      ],
      components: [],
      ephemeral: true,
    });
    return;
  }

  const clientTargetLanguageArray = clientData.targetLanguage.split(', ');
  const clientLevelArray = clientData.level.split(', ');

  const studyBuddies = await StudyBuddy.find({
    id: { $ne: interaction.user.id },
    $or: clientTargetLanguageArray.map((targetLanguage) => ({
      targetLanguage: { $regex: targetLanguage, $options: 'i' },
    })),
  }).sort({ updatedAt: -1 });

  const filteredStudyBuddies = studyBuddies.filter((studyBuddy) => {
    const studyBuddyTargetLanguageArray = studyBuddy.targetLanguage.split(', ');
    const studyBuddyLevelArray = studyBuddy.level.split(', ');

    return studyBuddyTargetLanguageArray.find((studyBuddyTargetLanguage, studyBuddyIndex) => {
      const clientIndex = clientTargetLanguageArray.findIndex(
        (clientTargetLanguage) => clientTargetLanguage === studyBuddyTargetLanguage,
      );

      return (
        clientIndex !== -1 &&
        clientLevelArray[clientIndex] === studyBuddyLevelArray[studyBuddyIndex]
      );
    });
  });

  const studyBuddyListLength = filteredStudyBuddies.length;

  if (studyBuddyListLength === 0) {
    await interaction.reply({
      embeds: [
        {
          color: 0xc3c3e5,
          title: 'Get Study Buddy Listings',
          description: `${userMention(interaction.user.id)}, there are no study buddy matches.`,
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const { customId } = interaction;
  const previous = interaction.message;
  const currentPage = previous.embeds[0].title.split('/')[0];

  let offset;
  if (customId === 'get-study-buddy-first') {
    offset = 0;
  } else if (customId === 'get-study-buddy-previous') {
    offset = currentPage - 2;
  } else if (customId === 'get-study-buddy-next') {
    offset = currentPage;
  } else if (customId === 'get-study-buddy-last') {
    offset = studyBuddyListLength - 1;
  }

  const page = +offset + 1;

  const studyBuddy = filteredStudyBuddies[offset];

  if (!studyBuddy) {
    await interaction.update({
      embeds: [
        {
          color: 0xc3c3e5,
          title: 'Get Study Buddy Listings',
          description: `${userMention(interaction.user.id)}, there are no study buddy matches.`,
        },
      ],
      components: [],
      ephemeral: true,
    });

    return;
  }

  const studyBuddyObject = await client.users.fetch(studyBuddy.id);

  const targetLanguageArray = studyBuddy.targetLanguage.split(', ');
  const levelArray = studyBuddy.level.split(', ');

  await interaction.update({
    embeds: [
      {
        color: 0xc3c3e5,
        title: `${page}/${studyBuddyListLength} Study Buddy`,
        description: `${userMention(studyBuddyObject.id)}`,
        fields: [
          {
            name: 'Target Language(s)',
            value: `\`\`\`${targetLanguageArray
              .map((e, i) => `- ${e}(${levelArray[i]})`)
              .join('\n')}\`\`\``,
          },
          {
            name: 'Introduction',
            value: `\`\`\`${studyBuddy.introduction}\`\`\``,
          },
          {
            name: 'Last updated',
            value: `${time(studyBuddy.updatedAt, 'F')}`,
          },
        ],
        author: {
          name: `${studyBuddyObject?.globalName}(${studyBuddyObject?.username}#${studyBuddyObject?.discriminator})`,
          icon_url: studyBuddyObject?.avatarURL(),
        },
      },
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('get-study-buddy-first')
          .setLabel('<<')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId('get-study-buddy-previous')
          .setLabel('<')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId('get-study-buddy-next')
          .setLabel('>')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === studyBuddyListLength),
        new ButtonBuilder()
          .setCustomId('get-study-buddy-last')
          .setLabel('>>')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === studyBuddyListLength),
      ),
    ],
    ephemeral: true,
  });
};
