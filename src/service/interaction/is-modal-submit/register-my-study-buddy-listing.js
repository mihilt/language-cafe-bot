import { userMention } from 'discord.js';
import config from '../../../config/index.js';
import languages from '../../../data/languages.js';
import StudyBuddy from '../../../models/study-buddy.js';

const convertToProperCase = (input) => {
  const words = input.toLowerCase().split(' ');
  const capitalizedWords = words.map((word) => {
    const firstChar = word.charAt(0).toUpperCase();
    const remainingChars = word.slice(1);
    return firstChar + remainingChars;
  });
  return capitalizedWords.join(' ');
};

export default async (interaction) => {
  const targetLanguage = interaction.fields.getTextInputValue('targetLanguage');
  const level = interaction.fields.getTextInputValue('level');
  const introduction = interaction.fields.getTextInputValue('introduction');

  const targetLanguageArray = targetLanguage
    .split(',')
    .map((language) => language.trim())
    .map(convertToProperCase);

  const invalidTargetLanguage = targetLanguageArray.filter(
    (language) => !languages.includes(language),
  );

  if (invalidTargetLanguage.length > 0) {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Register Study Buddy Listing',
          description: `Please enter a valid target language(s).\n\nInvalid language(s): ${invalidTargetLanguage
            .map((e) => `\`${e}\``)
            .join(
              ', ',
            )}\n\nYou can check the list of language options we have in our database by using the \`/get-language-list\` command.`,
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const levelArray = level
    .split(',')
    .map((e) => e.trim())
    .map(convertToProperCase);

  if (levelArray.length !== targetLanguageArray.length) {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Register Study Buddy Listing',
          description: 'Please enter the proper number of levels for the target languages.',
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const invalidLevel = levelArray.filter((e) => !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(e));

  if (invalidLevel.length > 0) {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Register Study Buddy Listing',
          description: `Please enter a valid level(s).\n\nInvalid level(s): ${invalidLevel.join(
            ', ',
          )}`,
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const refinedTargetLanguage = targetLanguageArray.join(', ');

  const studyBuddy = await StudyBuddy.findOne({
    where: {
      id: interaction.member.user.id,
    },
  });

  if (studyBuddy) {
    await StudyBuddy.update(
      {
        targetLanguage: refinedTargetLanguage,
        level,
        introduction,
      },
      {
        where: {
          id: interaction.member.user.id,
        },
      },
    );
  } else {
    await StudyBuddy.create({
      id: interaction.member.user.id,
      targetLanguage: refinedTargetLanguage,
      level,
      introduction,
    });
  }

  await interaction.reply({
    embeds: [
      {
        color: 0x65a69e,
        title: 'Register Study Buddy Listing',
        description: `${userMention(
          interaction.member.user.id,
        )} has registered their study buddy listing.`,
        fields: [
          {
            name: 'Target Language(s)',
            value: `\`\`\`${targetLanguageArray
              .map((e, i) => `- ${e}(${levelArray[i]})`)
              .join('\n')}\`\`\``,
          },
          {
            name: 'Introduction',
            value: `\`\`\`${introduction}\`\`\``,
          },
        ],
        author: {
          name: `${interaction.member.user.globalName}(${interaction.member.user.username}#${interaction.member.user.discriminator})`,
          icon_url: interaction.member.user.avatarURL(),
        },
      },
    ],
  });

  await interaction.followUp({
    embeds: [
      {
        color: 0x65a69e,
        title: 'You have successfully registered your study buddy listing.',
        description: `Now, click the blue text right here </get-study-buddy-listings:${config.GET_STUDY_BUDDY_LISTINGS_COMMAND_ID}> and send it to show all potential study buddies.\n\nIf nobody shows up, that just means that there isn't a perfect match for you in our database yet. Make sure to come back in the future to try again!`,
      },
    ],
    ephemeral: true,
  });

  const channelId = interaction.channel.id;

  const title = 'How to Use the find-study-buddy Channel';

  const description = `Click the blue text here </register-my-study-buddy-listing:${config.REGISTER_MY_STUDY_BUDDY_LISTING_COMMAND_ID}> and send it to input your study buddy listing in our database.\n\nStill have questions? Click the link here https://discord.com/channels/739911855795077282/1230684714415820890/1230684919483859036 for a step-by-step explanation and video tutorial.`;

  const currentMessages = await interaction.client.channels.cache
    .get(channelId)
    .messages.fetch({ limit: 50 });

  const stickyMessage = currentMessages.find(
    (message) => message?.author?.id === config.CLIENT_ID && message?.embeds[0]?.title === title,
  );

  await stickyMessage?.delete().catch(() => {});

  await interaction.client.channels.cache.get(channelId).send({
    embeds: [
      {
        color: 0x65a69e,
        title,
        description,
      },
    ],
  });
};
