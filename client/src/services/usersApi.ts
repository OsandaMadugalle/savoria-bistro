// Fetch all users (admins, staff, etc.)
import { User } from '../types';
const API_URL = 'http://localhost:5000/api';

export const fetchAllUsers = async (): Promise<User[]> => {
  const res = await fetch(`${API_URL}/auth/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
};
