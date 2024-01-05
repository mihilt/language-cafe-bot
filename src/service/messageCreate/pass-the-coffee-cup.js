import alphabet from '../../data/alphabet.js';

export default async (message) => {
  if (message.content.includes('<@')) return;
  message.react(alphabet[Math.floor(Math.random() * alphabet.length)]).catch(() => {});
};
