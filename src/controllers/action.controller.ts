import { Request, Response } from 'express';
import RefreshToken from '../models/tokens.model';
import { IUserRequest } from '../utils/validateToken';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/users.model';
import Transaction from '../models/transaction.model';
import { handleErrors } from '../utils/handleErrors';
import jwt, { Secret } from 'jsonwebtoken';
import { CustomJwtPayload } from '../utils/validateToken';
import { transportMail } from '../utils/nodemailer';

const { FLW_SECRET_KEY, FLW_SECRET_HASH, CLIENT_URL, SESSION_SECRET, FLW_SECRET_TOKEN } = process.env;

const validateOAuthSession = async (req: IUserRequest, res: Response) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ message: 'Token ID is required!' });

    const { userId } = jwt.verify(tokenId, SESSION_SECRET as Secret) as CustomJwtPayload;
    if (!userId) return res.status(401).json({ message: 'Invalid Token' });

    // generate tokens
    const token = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // update refreshToken in DB
    const newRefreshToken = new RefreshToken({ token: refreshToken, user: userId });
    await newRefreshToken.save();

    // set cookies for tokens
    res.cookie('accessToken', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });

    // res.redirect(`${CLIENT_URL}`);
    res.sendStatus(200);
  } catch (error) {
    handleErrors({ res, error });
  }
};

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
        amount: '500',
        currency: 'NGN',
        redirect_url: `${CLIENT_URL}`, // ideally be a frontend url
        customer: {
          email: user.email,
        },
        customizations: {
          title: 'QuickMnemo Subscription',
          description: 'QuickMnemo: Effortlessly generate personalized mnemonics to enhance memory retention and learning. Simplify complex information with our user-friendly platform.',
        },
        payment_plan: 67687,
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

    // generate token
    // send token to mail

    res.status(200).json({ message: data.data.link });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const paymentCallback = async (req: IUserRequest, res: Response) => {
  try {
    const { status, tx_ref, transaction_id } = req.body;

    if (status === 'successful' || status === 'completed') {
      const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      });

      const dataObj = response.data.data;

      if (dataObj.status === 'successful' && dataObj.amount === 500 && dataObj.currency === 'NGN') {
        const transaction = await Transaction.findOne({ ref: tx_ref });
        if (!transaction) return res.status(404).json({ message: 'Transaction not found!' });

        transaction.isSuccessful = true;
        await transaction.save();

        const user = await User.findById(transaction.user);
        if (!user) return res.status(404).json({ message: 'User not found!' });

        // send token to user email
        await transportMail({ email: user.email });

        return res.status(200).json({ message: 'Payment successfully made!' });
      }
    } else if (status === 'pending') {
      return res.status(202).json({ message: 'Payment is still pending. Please wait for confirmation.' });
    }

    return res.status(400).json({ message: 'Payment was not successful.' });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const cancelSubscription = async (req: IUserRequest, res: Response) => {
  try {
    // cancel user subscription
    const response = axios.put(`https://api.flutterwave.com/v3/subscriptions/:id/cancel`, {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const generateMnemonics = async (req: Request, res: Response) => {
  try {
    // generate mnemonics
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

export { validateOAuthSession, generateNewToken, initiatePayment, paymentCallback };
