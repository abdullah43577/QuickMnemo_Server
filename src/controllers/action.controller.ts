import { Request, Response } from 'express';
import RefreshToken from '../models/tokens.model';
import { IUserRequest } from '../utils/validateToken';
import { generateAccessToken } from '../utils/generateToken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/users.model';
import Transaction from '../models/transaction.model';
import { handleErrors } from '../utils/handleErrors';

const { FLW_SECRET_KEY, FLW_SECRET_HASH } = process.env;

const generateNewToken = async (req: IUserRequest, res: Response) => {
  try {
    const { userId, refreshToken } = req;

    const refreshTokens = await RefreshToken.findOne({ token: refreshToken });

    if (!refreshTokens || refreshToken !== refreshTokens.token || userId !== refreshTokens.user.toString()) return res.status(401).json({ message: 'unauthorized' });

    const accessToken = generateAccessToken(userId as string);
    res.cookie('accessToken', accessToken, { secure: true, httpOnly: true, maxAge: 30 * 60 * 1000 });
    res.status(200).json({ message: 'Access token generated successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error', error });
  }
};

const initiatePayment = async (req: IUserRequest, res: Response) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    const tx_ref = uuidv4();
    const { data } = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount: '950',
        currency: 'NGN',
        redirect_url: 'http://localhost:8080/auth/payment/callback', // ideally be a frontend url
        customer: {
          email: user.email,
        },
        customizations: {
          title: 'QuickMnemo Subscription',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // store data in DB
    const transaction = new Transaction({ user: userId, ref: tx_ref });
    await transaction.save();

    res.status(200).json({ message: data.data.link });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const paymentCallback = async (req: Request, res: Response) => {
  try {
    const { status, tx_ref, transaction_id } = req.query;
    if (status === 'successful' || status === 'completed') {
      // verify transaction
      const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      });

      if (response.data.status === 'successful' && response.data.amount === 950 && response.data.currency === 'NGN') {
        console.log('i ran');
        // update transaction
        const transaction = await Transaction.findOne({ ref: tx_ref });
        if (!transaction) return res.status(404).json({ message: 'Transaction not found!' });

        console.log(transaction, 'transact');
        transaction.isSuccessful = true;
        await transaction.save();

        res.status(200).json({ message: 'Payment successfully made!' });
      }
    } else if (status === 'pending') {
      return res.status(202).json({ message: 'Payment is still pending. Please wait for confirmation.' });
    } else {
      return res.status(400).json({ message: 'Payment was not successful.' });
    }
  } catch (error) {
    handleErrors({ res, error });
  }
};

const paymentWebhook = async (req: Request, res: Response) => {
  try {
    // If you specified a secret hash, check for the signature
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== FLW_SECRET_HASH) {
      // This request isn't from Flutterwave; discard
      res.sendStatus(401);
    }
    const payload = req.body;
    // It's a good idea to log all received events.
    console.log(payload);
    res.sendStatus(200);
  } catch (error) {
    handleErrors({ res, error });
  }
};

export { generateNewToken, initiatePayment, paymentCallback };
