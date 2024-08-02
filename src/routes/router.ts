import { Router } from 'express';
import { login, logout, register, testApi } from '../controllers/auth.controller';
import { IUserRequest, validateAccessToken, validateRefreshToken } from '../utils/validateToken';
import { generateNewToken, initiatePayment, paymentCallback } from '../controllers/action.controller';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import RefreshToken from '../models/tokens.model';
import passport from 'passport';

const router = Router();

//* Google Auth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google'), async (req: IUserRequest, res) => {
  try {
    const { user } = req;
    if (!user) return res.status(401).json({ error: 'Authentication failed' });

    const userId = (user as any)._id.toString();

    // generate tokens
    const token = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // update refreshToken in DB
    const newRefreshToken = new RefreshToken({ token: refreshToken, user: userId });
    await newRefreshToken.save();

    // set cookies for tokens
    res.cookie('accessToken', token, { httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ message: 'User logged in successfully', token, refreshToken });
  } catch (error) {
    res.status(500).json({ message: 'Interal Server Error', error });
  }
});

// auth routes
router.get('/', testApi);
router.post('/register', register);
router.post('/login', login);
router.delete('/logout', validateRefreshToken, logout);

// action routes
router.post('/token', validateRefreshToken, generateNewToken);
router.post('/payment', validateAccessToken, initiatePayment);
router.get('/payment/callback', paymentCallback);
export { router };
