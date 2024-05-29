import mongoose from 'mongoose';

const { Schema } = mongoose;

const point = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: Number,
    },
    counting: {
      type: Number,
    },
    emojiBlend: {
      type: Number,
    },
    matchMatch: {
      type: Number,
    },
    passTheCoffeeCup: {
      type: Number,
    },
    shiritori: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('point', point);
