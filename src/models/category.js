import mongoose from 'mongoose';

const { Schema } = mongoose;

const category = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    alphabet: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('category', category);
