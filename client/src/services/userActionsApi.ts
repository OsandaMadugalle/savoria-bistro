// API for editing and deleting users
import { User } from '../types';
const API_URL = 'http://localhost:5000/api';

export const updateUser = async (email: string, updates: Partial<User>): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/update-user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, updates })
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
};

export const deleteUser = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/delete-user`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error('Failed to delete user');
};
