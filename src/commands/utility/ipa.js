import axios from 'axios';
import { SlashCommandBuilder } from 'discord.js';
import { JSDOM } from 'jsdom';

const data = new SlashCommandBuilder()
  .setName('ipa')
  .setDescription('Get the Transcription of a word')
  .addStringOption((option) =>
    option
      .setName('input')
      .setDescription('The word to get the Transcription of')
      .setRequired(true),
  );

export default {
  data,
  async execute(interaction) {
    const input = interaction.options.getString('input');

    try {
      const url = `https://en.wiktionary.org/wiki/${input}`;

      const wiktionaryRes = await axios.get(url);

      const dom = new JSDOM(wiktionaryRes.data);

      const { window } = dom;
      const { document } = window;

      const h2Elements = document.querySelector('.mw-parser-output').querySelectorAll('H2');

      const extractedGroups = [];

      h2Elements.forEach((h2, index) => {
        const nextH2 = h2Elements[index + 1]; // Get the next h2 element

        let currentElement = h2.nextSibling;
        const groupFragment = dom.window.document.createDocumentFragment();

        // Loop until we reach the next h2 or null
        while (currentElement !== nextH2 && currentElement !== null) {
          if (currentElement.nodeType === dom.window.Node.ELEMENT_NODE) {
            groupFragment.appendChild(currentElement.cloneNode(true));
          }
          currentElement = currentElement.nextSibling;
        }

        if (groupFragment.childNodes.length > 0) {
          extractedGroups.push(groupFragment);
        }
      });

      const languageGroup = [];

      extractedGroups.forEach((group, index) => {
        if (
          group.querySelector('.IPA') ||
          h2Elements[index].querySelector('.mw-headline')?.textContent
        ) {
          const ipaElements = group.querySelectorAll('.IPA');

          const ipaArray = [];
          const dialect = [];

          for (let i = 0; i < ipaElements.length; i++) {
            if (ipaElements[i].textContent) {
              ipaArray.push(ipaElements[i].textContent);
              dialect.push(ipaElements[i].parentElement.getElementsByClassName('extiw'));
            }
          }

          const dialectContent = dialect.map((e) => {
            if (e?.length) {
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
            .map((ipa, i) => {
              if (dialectContent[i] === '') return `${ipa}`;
              return `${ipa} (${dialectContent[i]})`;
            });

          languageGroup.push({
            language: h2Elements[index].querySelector('.mw-headline').textContent,
            ipa: ipaContent,
          });
        }
      });

      const filteredLanguageGroup = languageGroup.filter((group) => group.ipa.length);

      let content = filteredLanguageGroup
        .map((group) => `**${group.language}**\n${group.ipa.join('\n')}`)
        .join('\n\n');

      content += `\n\n[Data from Wiktionary](${url})`;

      const embed = {
        color: 0x65a69e,
        title: `Transcription for ${input}`,
        description: content,
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
