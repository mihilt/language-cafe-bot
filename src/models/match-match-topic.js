import mongoose from 'mongoose';

const { Schema } = mongoose;

const matchMatchTopic = new Schema(
  {
    topic: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('match_match_topic', matchMatchTopic);
