import mongoose from 'mongoose';

const { Schema } = mongoose;

const studyBuddy = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    targetLanguage: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    introduction: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('study-buddy', studyBuddy);
