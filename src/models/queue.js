import mongoose from 'mongoose';

const { Schema } = mongoose;

const queue = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('queue', queue);
