import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/database';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: Omit<IUser, 'password'> | null;
    }
  }
}
interface DecodedToken extends JwtPayload { id: number; }

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET missing.');
      const decoded = jwt.verify(token, jwtSecret as Secret) as DecodedToken;
      const user = await getDb().get<Omit<IUser, 'password'>>(
        'SELECT id, username, email, createdAt, updatedAt FROM users WHERE id = ?',
        [decoded.id]
      );
      if (!user) {
        res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        return;
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Error:', error instanceof Error ? error.message : error);
      if (error instanceof jwt.TokenExpiredError) res.status(401).json({ success: false, message: 'Token expired' });
      else if (error instanceof jwt.JsonWebTokenError) res.status(401).json({ success: false, message: 'Invalid token' });
      else res.status(401).json({ success: false, message: 'Token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'No token' });
  }
};
