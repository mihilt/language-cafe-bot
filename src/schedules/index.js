import schedule from 'node-schedule';
import checkIfPassTheCoffeeCupLastMessageIsValid from '../service/schedules/check-if-pass-the-coffee-cup-last-message-is-valid.js';
import initializeEmojiBlendPoint from '../service/schedules/initialize-emoji-blend-point.js';
import sendANewMatchMatchMessage from '../service/schedules/send-a-new-match-match-message.js';

export default function schedules() {
  schedule.scheduleJob('0 * * * *', () => {
    checkIfPassTheCoffeeCupLastMessageIsValid();
  });

  schedule.scheduleJob('0 0 * * *', () => {
    sendANewMatchMatchMessage();
  });

  schedule.scheduleJob('0 0 1 * *', async () => {
    initializeEmojiBlendPoint();
  });
}
