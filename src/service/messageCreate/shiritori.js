import point from '../../models/point.js';

export default async (message) => {
  await point.updateOne({ id: message.author.id }, { $inc: { shiritori: 3 } }, { upsert: true });
};
