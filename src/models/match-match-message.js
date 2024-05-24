import mongoose from 'mongoose';

const { Schema } = mongoose;

const matchMatchMessage = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    submissionInTargetLanguage: {
      type: String,
      required: true,
    },
    submission: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('match_match_message', matchMatchMessage);
