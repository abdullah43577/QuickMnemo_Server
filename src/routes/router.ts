import { Router } from 'express';
import { login, logout, register, testApi } from '../controllers/auth.controller';
import { IUserRequest, validateAccessToken, validateRefreshToken } from '../utils/validateToken';
import { validateOAuthSession, generateNewToken, initiatePayment, paymentCallback, cancelSubscription, getUserInfo, paymentWebhook, saveMnemonics, deleteMnemonics, generateMnemonics } from '../controllers/action.controller';
import passport from 'passport';
import jwt, { Secret } from 'jsonwebtoken';

const { SESSION_SECRET, CLIENT_URL } = process.env;

const router = Router();

//* Google Auth route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'consent' }));
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
router.get('/subscribe', validateAccessToken, initiatePayment);
router.post('/subscribe/callback', validateAccessToken, paymentCallback);
router.put('/subscription/cancel', validateAccessToken, cancelSubscription);
router.post('/flw-webhook', paymentWebhook);
router.get('/user-info', validateAccessToken, getUserInfo);
router.put('/save-mnemonics', validateAccessToken, saveMnemonics);
router.put('/delete-mnemonics', validateAccessToken, deleteMnemonics);
router.post('/generate-mnemonics', validateAccessToken, generateMnemonics);

export { router };
