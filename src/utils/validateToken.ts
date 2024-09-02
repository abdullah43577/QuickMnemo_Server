import { NextFunction, Request, Response } from 'express';
import 'dotenv/config';
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

export interface IUserRequest extends Request {
  userId?: any;
  refreshToken?: any;
}

export interface CustomJwtPayload extends JwtPayload {
  id: string;
}

export const validateAccessToken = function (req: IUserRequest, res: Response, next: NextFunction) {
  let { reqType } = req.body;
  console.log(req.body);
  if (reqType.toLowerCase() === 'mnemonic') return next(); //* this is used to bypass the normal token validation for mnemonic generation

  let token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Denied, No token provided!' });

  try {
    const { id } = jwt.verify(token, ACCESS_TOKEN_SECRET as Secret) as CustomJwtPayload;
    req.userId = id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized Access!' });
  }
};

export const validateRefreshToken = function (req: IUserRequest, res: Response, next: NextFunction) {
  let refreshToken = req.body.refreshToken;

  if (!refreshToken) return res.status(401).json({ message: 'Access Denied, Refresh token not provided!' });

  try {
    const { id } = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET as Secret) as CustomJwtPayload;
    req.userId = id;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized Access!' });
  }
};
