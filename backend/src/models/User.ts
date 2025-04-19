export interface IUser {
  id: number;
  username: string;
  email: string;
  password?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
