import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { getDb } from '../config/database';
import { IUser } from '../models/User';

const SALT = 10;
const genToken = (id: number): string => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET missing.');
  return jwt.sign({ id }, s as Secret, { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 6) {
    res.status(400).json({ success: false, message: 'Valid username, email, password (min 6) required' });
    return;
  }
  try {
    const existing = await getDb().get<Pick<IUser, 'id'>>('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) {
      res.status(409).json({ success: false, message: 'User exists' });
      return;
    }
    const hashed = await bcrypt.hash(password, SALT);
    const result = await getDb().run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashed]);
    if (!result.lastID) throw new Error('Insert failed');
    const newUser = await getDb().get<Omit<IUser, 'password'>>('SELECT id, username, email FROM users WHERE id = ?', [result.lastID]);
    if (!newUser) throw new Error('Retrieve failed');
    const token = genToken(newUser.id);
    res.status(201).json({ success: true, message: 'Registered', token, user: newUser });
  } catch (e: any) {
    console.error('Reg Err:', e);
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') res.status(409).json({ success: false, message: 'User exists.' });
    else next(e);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Fields required' });
    return;
  }
  try {
    const user = await getDb().get<IUser>('SELECT id, username, email, password FROM users WHERE email = ?', [email]);
    if (!user?.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const userResp: Omit<IUser, 'password'> = { id: user.id, username: user.username, email: user.email };
    const token = genToken(user.id);
    res.status(200).json({ success: true, message: 'Login ok', token, user: userResp });
  } catch (e) {
    console.error('Login Err:', e);
    next(e);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  res.status(200).json({ success: true, data: req.user });
};
