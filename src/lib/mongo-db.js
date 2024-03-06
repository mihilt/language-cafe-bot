import mongoose from 'mongoose';

import config from '../config/index.js';

const { MONGO_URI: mongoUri } = config;

mongoose.set('strictQuery', false);

// Exit application on error
mongoose.connection.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

// print mongoose logs in dev env
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

const connect = async () => {
  try {
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log('mongoDB connected...');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('mongoDB connection error:', error);
  }
  return mongoose.connection;
};

export default connect;
