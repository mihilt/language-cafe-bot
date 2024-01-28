import mongoose from 'mongoose';

const { Schema } = mongoose;

const emojiBlend = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    point: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('emoji_blend', emojiBlend);
