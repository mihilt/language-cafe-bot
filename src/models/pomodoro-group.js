import mongoose from 'mongoose';

const { Schema } = mongoose;

const pomodoroGroup = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    startTimeStamp: {
      type: Number,
      required: true,
    },
    timeOption: [
      {
        type: String,
        required: true,
      },
    ],
    members: [
      {
        type: String,
        required: true,
      },
    ],
    channelId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('pomodoro-group', pomodoroGroup);
