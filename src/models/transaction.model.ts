import { Schema, Types, model } from 'mongoose';

interface ITransaction {
  user: Types.ObjectId;
  ref: string;
  isSuccessful: boolean;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: {
      ref: 'User',
      type: Schema.Types.ObjectId,
      required: true,
    },

    ref: {
      type: String,
      required: true,
    },

    isSuccessful: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Transaction = model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
