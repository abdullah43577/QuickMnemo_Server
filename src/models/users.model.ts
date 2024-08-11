import { Schema, model } from 'mongoose';

export interface IUser {
  email: string;
  password?: string;
  isPremium: boolean;
  subscription: {
    id: string;
    status: 'active' | 'pending' | 'cancelled';
  };
  savedMnemonics: string[];
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

    isPremium: {
      type: Boolean,
      default: false,
    },

    subscription: {
      id: {
        type: String,
        default: null,
      },

      status: {
        type: String,
        enum: ['active', 'pending', 'cancelled'],
        default: 'pending',
      },
    },

    savedMnemonics: { type: [String], default: [] },

    googleId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);

export default User;
