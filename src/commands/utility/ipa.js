import axios from 'axios';
import { SlashCommandBuilder } from 'discord.js';
import { JSDOM } from 'jsdom';

const data = new SlashCommandBuilder()
  .setName('ipa')
  .setDescription('IPA command')
  .addStringOption((option) => option.setName('input').setRequired(true));

export default {
  data,
  async execute(interaction) {
    const input = interaction.options.getString('input');

    const wiktionaryRes = await axios.get(`https://en.wiktionary.org/wiki/${input}`);

    const { window } = new JSDOM(wiktionaryRes.data);
    const { document } = window;
    const ipaElements = document.getElementsByClassName('IPA');

    const ipaArray = [];
    for (let i = 0; i < ipaElements.length; i++) {
      ipaArray.push(ipaElements[i].textContent);
    }

    ipaArray.forEach((ipa, index) => {
      // eslint-disable-next-line no-useless-escape
      ipaArray[index] = ipa.replace(/[\/\[\]]/g, '');
    });

    const ipaContent = ipaArray.map((ipa, index) => `${index + 1}. ${ipa}`);

    const embed = {
      color: 0x65a69e,
      title: `IPA for ${input}`,
      description: ipaContent.join('\n'),
    };

    await interaction.reply({ embeds: [embed] });
  },
};
