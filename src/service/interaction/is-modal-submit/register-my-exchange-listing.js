import { bold, userMention } from 'discord.js';
import ExchangePartner from '../../../models/ExchangePartner.js';
import languages from '../../../data/languages.js';

export default async (interaction) => {
  const targetLanguage = interaction.fields.getTextInputValue('targetLanguage');
  const offeredLanguage = interaction.fields.getTextInputValue('offeredLanguage');
  const introduction = interaction.fields.getTextInputValue('introduction');

  // check if targetLanguage is invalid
  const targetLanguageArray = targetLanguage.split(',').map((language) => language.trim());
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
  const offeredLanguageArray = offeredLanguage.split(',').map((language) => language.trim());
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

  const content = `${userMention(
    interaction.member.user.id,
  )} registered language exchange partner list.\n\n${bold(
    'Target language(s)',
  )}\n\`\`\`${refinedTargetLanguage}\`\`\`\n${bold(
    'Offered language(s)',
  )}\n\`\`\`${refinedOfferedLanguage}\`\`\`\n${bold('Introduction')}\n\`\`\`${introduction}\`\`\``;

  await interaction.reply({
    embeds: [
      {
        color: 0x65a69e,
        title: 'Register Language Exchange Partner List',
        description: content,
        author: {
          name: `${interaction.member.user.globalName}(${interaction.member.user.username}#${interaction.member.user.discriminator})`,
          icon_url: interaction.member.user.avatarURL(),
        },
      },
    ],
  });
};