import mongoose from 'mongoose';

const { Schema } = mongoose;

const point = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    categories: {
      type: Number,
    },
    counting: {
      type: Number,
    },
    emojiBlend: {
      type: Number,
    },
    letterChange: {
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

export const getTotalPoints = ({
  categories = 0,
  counting = 0,
  emojiBlend = 0,
  letterChange = 0,
  matchMatch = 0,
  passTheCoffeeCup = 0,
  shiritori = 0,
}) => categories + counting + emojiBlend + letterChange + matchMatch + passTheCoffeeCup + shiritori;
