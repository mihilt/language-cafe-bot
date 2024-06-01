import point from '../../models/point.js';

export default async (message) => {
  await point.updateOne({ id: message.author.id }, { $inc: { letterChange: 5 } }, { upsert: true });
};
