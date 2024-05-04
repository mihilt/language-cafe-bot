import mongoose from 'mongoose';

const { Schema } = mongoose;

const categoryScore = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('category_score', categoryScore);
