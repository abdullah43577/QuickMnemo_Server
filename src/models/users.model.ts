import { Schema, model } from 'mongoose';

interface IUser {
  email: string;
  password?: string;
  googleId?: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      default: null,
    },

    googleId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);

export default User;
