import { Request, Response } from 'express';
import RefreshToken from '../models/tokens.model';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import { authValidator, logoutValidator } from '../utils/validators';
import { handleErrors } from '../utils/handleErrors';
import User from '../models/users.model';
import { comparePassword, hashPassword } from '../utils/hashPassword';

const testApi = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'SERVERS ARE LIVE!!!' });
};

const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = authValidator.parse(req.body);

    //* check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User with credentials exists!' });

    const encryptedPassword = await hashPassword(password);

    const user = new User({ email, password: encryptedPassword });
    await user.save();

    res.status(200).json({ message: 'User created successfully!' });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = authValidator.parse(req.body);

    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(404).json({ message: 'User with credentials not found!' });

    //* decrypt password
    const isMatch = await comparePassword(password, existingUser.password as string);
    if (!isMatch) return res.status(400).json({ message: 'email or password incorrect' });

    //* generate tokens
    const accessToken = generateAccessToken(existingUser._id.toString());
    const refreshToken = generateRefreshToken(existingUser._id.toString());

    //* update refreshToken in DB
    const newRefreshToken = new RefreshToken({ token: refreshToken, userId: existingUser._id });
    await newRefreshToken.save();

    res.status(200).json({ message: 'User logged in successfully!', token: { accessToken, refreshToken } });
  } catch (error) {
    handleErrors({ res, error });
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = logoutValidator.parse(req.body);

    await RefreshToken.findOneAndDelete({ token: refreshToken });
    res.sendStatus(204);
  } catch (error) {
    handleErrors({ res, error });
  }
};

export { testApi, register, login, logout };
