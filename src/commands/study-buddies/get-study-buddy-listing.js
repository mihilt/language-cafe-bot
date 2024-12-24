import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  time,
  userMention,
} from 'discord.js';

import client from '../../client/index.js';
import StudyBuddy from '../../models/study-buddy.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-study-buddy-listings')
    .setDescription('Get study buddy listings'),

  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const clientData = await StudyBuddy.findOne(
      {
        id: interaction.user.id,
      },
      { targetLanguage: 1, level: 1, _id: 0 },
    );

    if (!clientData) {
      await interaction.reply({
        embeds: [
          {
            color: 0xc3c3e5,
            title: 'Get Study Buddy Listings',
            description: `${userMention(
              interaction.user.id,
            )}, you have not registered your study buddy listing yet.`,
          },
        ],
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

    const studyBuddy = filteredStudyBuddies[0];

    const studyBuddyObject = await client.users.fetch(studyBuddy.id);

    const targetLanguageArray = studyBuddy.targetLanguage.split(', ');
    const levelArray = studyBuddy.level.split(', ');

    await interaction.reply({
      embeds: [
        {
          color: 0xc3c3e5,
          title: `1/${studyBuddyListLength} Study Buddy`,
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
              value: time(studyBuddy.updatedAt, 'F'),
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
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('get-study-buddy-previous')
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('get-study-buddy-next')
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(studyBuddyListLength === 1),
          new ButtonBuilder()
            .setCustomId('get-study-buddy-last')
            .setLabel('>>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(studyBuddyListLength === 1),
        ),
      ],
      ephemeral: true,
    });
  },
};
