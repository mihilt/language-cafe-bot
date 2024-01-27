import mongoose from 'mongoose';

const { Schema } = mongoose;

const skippedPassTheCoffeeCupUser = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('skipped_pass_the_coffee_cup_user', skippedPassTheCoffeeCupUser);
