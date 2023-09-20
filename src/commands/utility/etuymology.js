import axios from 'axios';
import { SlashCommandBuilder } from 'discord.js';
import { JSDOM } from 'jsdom';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';
import { checkMaxContentLength } from '../../utils/index.js';

const data = new SlashCommandBuilder()
  .setName('etymology')
  .setDescription('Get the etymology of a word')
  .addStringOption((option) =>
    option
      .setName('input')
      .setMaxLength(20)
      .setDescription('The word to get the etymology of')
      .setRequired(true),
  );

export default {
  data,
  async execute(interaction) {
    await interaction.deferReply();
    const input = interaction.options.getString('input');

    channelLog(generateInteractionCreateLogContent(interaction, `input: ${input}`));

    const inputForUrl = input.replace(/ /g, '_');

    try {
      const url = `https://en.wiktionary.org/wiki/${inputForUrl}`;

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
          group.querySelector('[id^="Etymology"]') ||
          h2Elements[index].querySelector('.mw-headline')?.textContent
        ) {
          const etymologyElements = group.querySelectorAll('[id^="Etymology"]');
          const parentsNextElement = [];

          etymologyElements.forEach((element) => {
            parentsNextElement.push(element.parentElement.nextElementSibling);
          });

          // filter parentsNextElement is only p tag
          const filteredParentsNextElementTextContent = parentsNextElement
            .filter((element) => element.tagName === 'P')
            .map((element) => element.textContent);

          languageGroup.push({
            language: h2Elements[index].querySelector('.mw-headline').textContent,
            etymology: filteredParentsNextElementTextContent,
          });
        }
      });

      const filteredLanguageGroup = languageGroup.filter((group) => group.etymology.length);

      let content = filteredLanguageGroup
        .map(
          (group) => `**${group.language}**\n${group.etymology.join('\n').replace(/\*/g, '\\*')}`,
        )
        .join('\n');

      if (content === '') {
        content +=
          "It looks like the Wiktionary page for the word you entered doesn't have an etymology available.\n\n";
        content += `However, you can visit the word's Wiktionary page by clicking [here](${url}) for additional information.`;
      }

      const additionalContent = `\n[See more on Wiktionary](${url})`;
      content += additionalContent;

      content = checkMaxContentLength({ length: 4096, content, additionalContent });

      const embed = {
        color: 0x65a69e,
        title: `Etymology for ${input}`,
        description: content,
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await interaction.editReply({
          embeds: [
            {
              color: 0x65a69e,
              title: 'No etymology found.',
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
