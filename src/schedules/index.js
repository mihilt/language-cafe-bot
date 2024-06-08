import schedule from 'node-schedule';
import checkIfPassTheCoffeeCupLastMessageIsValid from '../service/schedules/check-if-pass-the-coffee-cup-last-message-is-valid.js';
import initializeEmojiBlendPoint from '../service/schedules/initialize-emoji-blend-point.js';
import sendANewMatchMatchMessage from '../service/schedules/send-a-new-match-match-message.js';
import initializePoint from '../service/schedules/initialize-point.js';

export default function schedules() {
  // every 10 seconds
  // schedule.scheduleJob('*/10 * * * * *', () => {

  // });

  // every hour
  schedule.scheduleJob('0 * * * *', () => {
    checkIfPassTheCoffeeCupLastMessageIsValid();
  });

  // every day at 00:00
  schedule.scheduleJob('0 0 * * *', () => {
    sendANewMatchMatchMessage();
  });

  // every month on the first day at 00:00
  schedule.scheduleJob('0 0 1 * *', async () => {
    await initializeEmojiBlendPoint();
    await initializePoint();
  });
}
