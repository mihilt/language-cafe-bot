import axios from 'axios';
import { SlashCommandBuilder } from 'discord.js';
import { JSDOM } from 'jsdom';

const data = new SlashCommandBuilder()
  .setName('ipa')
  .setDescription('Get the IPA of a word')
  .addStringOption((option) =>
    option.setName('input').setDescription('The word to get the IPA of').setRequired(true),
  );

export default {
  data,
  async execute(interaction) {
    const input = interaction.options.getString('input');

    try {
      const wiktionaryRes = await axios.get(`https://en.wiktionary.org/wiki/${input}`);

      const { window } = new JSDOM(wiktionaryRes.data);
      const { document } = window;
      const ipaElements = document.getElementsByClassName('IPA');

      if (!ipaElements.length || !ipaElements[0].textContent) throw new Error();

      const ipaArray = [];
      const dialect = [];

      for (let i = 0; i < ipaElements.length; i++) {
        ipaArray.push(ipaElements[i].textContent);
        dialect.push(ipaElements[i].parentElement.getElementsByClassName('extiw'));
      }

      const dialectContent = dialect.map((e) => {
        if (e.length) {
          const tempArray = [];
          for (let i = 0; i < e.length; i++) {
            if (e[i].textContent !== 'key') tempArray.push(e[i].textContent);
          }
          return tempArray.join(', ');
        }
        return '';
      });

      const ipaContent = ipaArray
        // filter ipa start with -
        .filter((ipa) => !ipa.startsWith('-'))
        .map((ipa, index) => {
          if (dialectContent[index] === '') return `${ipa}`;
          return `${ipa} (${dialectContent[index]})`;
        });

      const embed = {
        color: 0x65a69e,
        title: `IPA for ${input}`,
        description: ipaContent.join('\n'),
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await interaction.reply({
          embeds: [
            {
              color: 0x65a69e,
              title: 'No IPA found.',
              description: 'Please check your spelling and try again.',
            },
          ],
          ephemeral: true,
        });
        return;
      }
      console.error(error);
    }
  },
};
