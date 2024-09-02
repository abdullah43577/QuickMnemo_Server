import { Request, Response } from 'express';
import RefreshToken from '../models/tokens.model';
import { IUserRequest } from '../utils/validateToken';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import User, { IUser } from '../models/users.model';
import { handleErrors } from '../utils/handleErrors';
import jwt, { Secret } from 'jsonwebtoken';
import { CustomJwtPayload } from '../utils/validateToken';
import { transportMail } from '../utils/nodemailer';
import { savedMnemonicsSchema } from '../utils/validators';
import { cache } from '../server';
import { calculateNextPaymentDate } from '../utils/calculateNextPaymentDate';
import { generateMnemonic } from '../utils/claude/claude';

const { FLW_SECRET_KEY, FLW_SECRET_HASH, CLIENT_URL, SESSION_SECRET, PAYMENT_PLAN } = process.env;

const AMOUNT = 500;

const validateOAuthSession = async (req: IUserRequest, res: Response) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ message: 'Token ID is required!' });

    const { userId } = jwt.verify(tokenId, SESSION_SECRET as Secret) as CustomJwtPayload;
    if (!userId) return res.status(401).json({ message: 'Invalid Token' });

    // generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // update refreshToken in DB
    const newRefreshToken = new RefreshToken({ token: refreshToken, userId: userId });
    await newRefreshToken.save();

    res.status(200).json({ message: 'User logged in successfully!', token: { accessToken, refreshToken } });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const generateNewToken = async (req: IUserRequest, res: Response) => {
  try {
    const { userId, refreshToken } = req;

    const refreshTokens = await RefreshToken.findOne({ token: refreshToken });

    if (!refreshTokens || refreshToken !== refreshTokens.token || userId !== refreshTokens.userId.toString()) return res.status(401).json({ message: 'unauthorized' });

    const accessToken = generateAccessToken(userId as string);

    res.status(200).json({ message: 'Access token generated successfully!', accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error', error });
  }
};

const initiatePayment = async (req: IUserRequest, res: Response) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    //* IF USER WAS ONCE A SUBSCRIBER
    if (user.subscription.id) {
      await axios.put(`https://api.flutterwave.com/v3/subscriptions/user.subscription.id/activate`);

      user.subscription.status = 'active';
      await user.save();

      res.status(200).json({ type: 'subscription_activated', message: 'User subscription activated successfully' });
    } else {
      //* NEW SUBSCRIBER

      const tx_ref = uuidv4();

      const { data } = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref,
          amount: AMOUNT,
          currency: 'NGN',
          redirect_url: `${CLIENT_URL}`, // ideally be a frontend url
          customer: {
            email: user.email,
          },
          customizations: {
            title: 'QuickMnemo Subscription',
            description: 'QuickMnemo: Effortlessly generate personalized mnemonics to enhance memory retention and learning. Simplify complex information with our user-friendly platform.',
          },
          payment_plan: PAYMENT_PLAN,
        },
        {
          headers: {
            Authorization: `Bearer ${FLW_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.status(200).json({ type: 'new_subscription', message: data.data.link });
    }
  } catch (error) {
    handleErrors({ res, error });
  }
};

const paymentCallback = async (req: IUserRequest, res: Response) => {
  try {
    const { status, tx_ref, transaction_id } = req.body;
    const { userId } = req;

    if (status === 'successful' || status === 'completed') {
      const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      });

      const dataObj = response.data.data;

      if (dataObj.status === 'successful' && dataObj.amount === AMOUNT && dataObj.currency === 'NGN') {
        //* subscription ID
        const { id } = dataObj;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found!' });

        const subscribedAt = new Date();
        const nextPaymentDate = calculateNextPaymentDate(subscribedAt);

        user.subscription = {
          id,
          status: 'active',
          subscribedAt,
          nextPaymentDate,
        };

        user.isPremium = true;

        await user.save();

        // send subscription newsletter
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
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'user not found!' });

    // cancel user subscription
    await axios.put(`https://api.flutterwave.com/v3/subscriptions/${user.subscription.id}/cancel`, {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    user.subscription = {
      status: 'cancelled',
      cancelledAt: new Date(),
    };
    await user.save();

    res.status(200).json({ message: 'User subscription cancelled successfully' });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const getUserInfo = async (req: IUserRequest, res: Response) => {
  try {
    const key = req.originalUrl;
    const { userId } = req;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'user not found' });

    const newObj = {} as any;

    for (const key in user) {
      if (key === 'password' || key === 'googleId') {
        continue;
      }
      newObj[key] = user[key as keyof IUser];
    }

    // set cache
    cache.set(key, newObj);
    res.status(200).json(newObj);
  } catch (error) {
    handleErrors({ res, error });
  }
};

const saveMnemonics = async (req: IUserRequest, res: Response) => {
  try {
    const { userId } = req;
    const { savedMnemonics } = savedMnemonicsSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    user.savedMnemonics.push(...savedMnemonics);
    await user.save();

    res.sendStatus(200);
  } catch (error) {
    handleErrors({ res, error });
  }
};

const deleteMnemonics = async (req: IUserRequest, res: Response) => {
  try {
    const { userId } = req;
    const { txt } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'user not found!' });

    user.savedMnemonics = user.savedMnemonics.filter((mnemonic) => mnemonic.toLowerCase() !== txt.toLowerCase());
    await user.save();

    res.status(200).json({ message: 'Mnemonic deleted successfully!' });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const generateMnemonics = async (req: IUserRequest, res: Response) => {
  try {
    const { userId } = req;
    const { keyLetters, mnemonicType, reqType } = req.body;
    if (!keyLetters || !mnemonicType) return res.status(400).json({ message: 'Key-Letters and mnemonicType are required!' });

    //* get current user if applicable
    const user = await User.findById(userId);

    let generatedMnemonic;

    //* for users with account
    if (user) {
      if (user.isPremium) {
        if (keyLetters.length > 20) throw new Error('Mnemonics length must be 20 characters or less!');
        generatedMnemonic = await generateMnemonic({ keyLetters, mnemonicType, mnemonicCount: 20 });
      } else {
        if (keyLetters.length > 6) throw new Error('Mnemonics length must be 6 characters or less!');
        generatedMnemonic = await generateMnemonic({ keyLetters, mnemonicType: 'simple', mnemonicCount: 6 });
      }
    }

    //* for users without account
    if (!generatedMnemonic || reqType === 'mnemonic') {
      if (keyLetters.length > 6) throw new Error('Mnemonics length must be 6 characters or less!');
      generatedMnemonic = await generateMnemonic({ keyLetters, mnemonicType: 'simple', mnemonicCount: 6 });
    }

    //* extract data
    const sentencesArray = generatedMnemonic
      .split('\n')
      .filter((line) => line.trim().length > 0 && !line.startsWith("Here's"))
      .map((line) => line.trim().replace(/\.$/, ''));

    res.status(200).json({ message: 'Mnemonic generated successfully!', mnemonic: sentencesArray });
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

export { validateOAuthSession, generateNewToken, initiatePayment, paymentCallback, cancelSubscription, getUserInfo, saveMnemonics, deleteMnemonics, generateMnemonics, paymentWebhook };
