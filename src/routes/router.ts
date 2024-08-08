import { Router } from 'express';
import { login, logout, register, testApi } from '../controllers/auth.controller';
import { IUserRequest, validateAccessToken, validateRefreshToken } from '../utils/validateToken';
import { validateOAuthSession, generateNewToken, initiatePayment, paymentCallback } from '../controllers/action.controller';
import passport from 'passport';
import jwt, { Secret } from 'jsonwebtoken';

const { SESSION_SECRET, CLIENT_URL } = process.env;

const router = Router();

//* Google Auth route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google'), async (req: IUserRequest, res) => {
  try {
    const { user } = req;
    if (!user) return res.status(401).json({ error: 'Authentication failed' });

    const userId = (user as any)._id.toString();

    const tokenId = jwt.sign({ userId }, SESSION_SECRET as Secret, { expiresIn: '10m' });
    res.redirect(`${CLIENT_URL}?token=${tokenId}`);
  } catch (error) {
    res.status(500).json({ message: 'Interal Server Error', error });
  }
});
router.post('/google/callback/validate-session', validateOAuthSession);

// auth routes
router.get('/', testApi);
router.post('/register', register);
router.post('/login', login);
router.delete('/logout', validateRefreshToken, logout);

// action routes
router.post('/token', validateRefreshToken, generateNewToken);
router.get('/payment', validateAccessToken, initiatePayment);
router.post('/payment/callback', validateAccessToken, paymentCallback);

export { router };
