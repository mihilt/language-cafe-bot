import { bold, userMention } from 'discord.js';
import ExchangePartner from '../../../models/ExchangePartner.js';

export default async (interaction) => {
  const targetLanguage = interaction.fields.getTextInputValue('targetLanguage');
  const offeredLanguage = interaction.fields.getTextInputValue('offeredLanguage');
  const introduction = interaction.fields.getTextInputValue('introduction');

  // filter if it is not flag emoji char 🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿

  const refinedTargetLanguage = targetLanguage.replace(
    // eslint-disable-next-line no-misleading-character-class
    /[^🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿]/gu,
    '',
  );

  const refinedOfferedLanguage = offeredLanguage.replace(
    // eslint-disable-next-line no-misleading-character-class
    /[^🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿]/gu,
    '',
  );

  // check if targetLanguage is valid flag emoji
  if (refinedTargetLanguage.length % 4 !== 0) {
    await interaction.reply({
      content: 'Please enter a valid target language(s).',
      ephemeral: true,
    });
    return;
  }

  // check if offeredLanguage is valid flag emoji
  if (refinedOfferedLanguage.length % 4 !== 0) {
    await interaction.reply({
      content: 'Please enter a valid offered language(s).',
      ephemeral: true,
    });
    return;
  }

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
      },
    ],
  });
};
