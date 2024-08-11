import 'dotenv/config';
const { DB_USER, DB_PASS, DB_NAME } = process.env;
import mongoose from 'mongoose';

export const connectDB = async () => {
  const dbURI = `mongodb+srv://${DB_USER}:${DB_PASS}@mnemonicscluster.x0keyqz.mongodb.net/${DB_NAME}`;

  try {
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.log('Error connecting to MongoDB', err);
  }
};
