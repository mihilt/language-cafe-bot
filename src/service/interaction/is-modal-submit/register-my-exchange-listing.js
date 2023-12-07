import { userMention } from 'discord.js';
import config from '../../../config/index.js';
import languages from '../../../data/languages.js';
import ExchangePartner from '../../../models/ExchangePartner.js';

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
  const offeredLanguage = interaction.fields.getTextInputValue('offeredLanguage');
  const introduction = interaction.fields.getTextInputValue('introduction');

  // check if targetLanguage is invalid
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
          title: 'Register Language Exchange Partner List',
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

  // check if offeredLanguage is invalid
  const offeredLanguageArray = offeredLanguage
    .split(',')
    .map((language) => language.trim())
    .map(convertToProperCase);

  const invalidOfferedLanguage = offeredLanguageArray.filter(
    (language) => !languages.includes(language),
  );

  if (invalidOfferedLanguage.length > 0) {
    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          title: 'Register Language Exchange Partner List',
          description: `Please enter a valid offered language(s).\n\nInvalid language(s): ${invalidOfferedLanguage.join(
            ', ',
          )}\n\nYou can check the list of language options we have in our database by using the \`/get-language-list\` command.`,
        },
      ],
      ephemeral: true,
    });
    return;
  }

  const refinedTargetLanguage = targetLanguageArray.join(', ');
  const refinedOfferedLanguage = offeredLanguageArray.join(', ');

  const exchangePartner = await ExchangePartner.findOne({
    where: {
      id: interaction.member.user.id,
    },
  });

  if (exchangePartner) {
    await ExchangePartner.update(
      {
        targetLanguage: refinedTargetLanguage,
        offeredLanguage: refinedOfferedLanguage,
        introduction,
      },
      {
        where: {
          id: interaction.member.user.id,
        },
      },
    );
  } else {
    await ExchangePartner.create({
      id: interaction.member.user.id,
      targetLanguage: refinedTargetLanguage,
      offeredLanguage: refinedOfferedLanguage,
      introduction,
    });
  }

  await interaction.reply({
    embeds: [
      {
        color: 0x65a69e,
        title: 'Register Language Exchange Partner List',
        description: `${userMention(
          interaction.member.user.id,
        )} has registered their language exchange partner listing.`,
        fields: [
          {
            name: 'Target Language(s)',
            value: `\`\`\`${refinedTargetLanguage}\`\`\``,
          },
          {
            name: 'Offered Language(s)',
            value: `\`\`\`${refinedOfferedLanguage}\`\`\``,
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
        title: 'You have successfully registered your language exchange partner listing.',
        description: `Now, click the blue text right here </get-exchange-listings:${config.GET_EXCHANGE_LISTINGS_COMMAND_ID}> and send it to show all potential exchange partners.\n\nIf nobody shows up, that just means that there isn't a perfect match for you in our database yet. Make sure to come back in the future to try again!`,
      },
    ],
    ephemeral: true,
  });

  const channelId = interaction.channel.id;

  const title = 'Find Exchange Partner Message Format';

  const description = `Click the blue text here </register-my-exchange-listing:${config.REGISTER_MY_EXCHANGE_LISTING_COMMAND_ID}> and send it to input your language exchange listing in our database.\n\nHave questions on how to do so? Please take a look at the photo below for the basics and check out https://discord.com/channels/739911855795077282/788764507857879041/789855943017496596 for more details.`;

  const currentMessages = await interaction.client.channels.cache
    .get(channelId)
    .messages.fetch({ limit: 50 });

  const stickyMessage = currentMessages.find(
    (message) => message?.author?.id === config.CLIENT_ID && message?.embeds[0]?.title === title,
  );

  await stickyMessage?.delete();

  await interaction.client.channels.cache.get(channelId).send({
    embeds: [
      {
        color: 0x65a69e,
        title,
        description,
        image: {
          url: 'https://cdn.discordapp.com/attachments/1144589131813503037/1171258140436746250/image.png?ex=655c0625&is=65499125&hm=5fa203e6c18b561452d09c22758f9a1f5edbad3ff6af99885ccd0f464e90f640&',
        },
      },
    ],
  });
};
