import point from '../../models/point.js';

export default async (message) => {
  await point.updateOne({ id: message.author.id }, { $inc: { counting: 1 } }, { upsert: true });
};
