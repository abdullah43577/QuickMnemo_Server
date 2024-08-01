import { Response } from 'express';
import RefreshToken from '../models/tokens.model';
import { IUserRequest } from '../utils/validateToken';
import { generateAccessToken } from '../utils/generateToken';

const generateNewToken = async (req: IUserRequest, res: Response) => {
  try {
    const { userId, refreshToken } = req;

    const refreshTokens = await RefreshToken.findOne({ token: refreshToken });
    if (!refreshTokens || userId !== refreshToken.user) return res.status(401).json({ message: 'unauthorized' });

    const accessToken = generateAccessToken(userId as string);
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error', error });
  }
};

export { generateNewToken };
