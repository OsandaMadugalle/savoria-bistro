// API for editing and deleting users
import { User } from '../types';
import { getAuthHeaders } from './api';
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

export const updateUser = async (email: string, updates: Partial<User>): Promise<User> => {
  const requesterEmail = (updates as any).requesterEmail;
  const res = await fetch(`${API_URL}/auth/update-user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, updates, requesterEmail })
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
};

export const deleteUser = async (email: string): Promise<void> => {
  const requesterEmail = (window as any).currentUserEmail || '';
  const res = await fetch(`${API_URL}/auth/delete-user`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, requesterEmail })
  });
  if (!res.ok) throw new Error('Failed to delete user');
};

export const fetchActivityLogs = async (requesterEmail: string) => {
  const res = await fetch(`${API_URL}/auth/activity-logs?requesterEmail=${encodeURIComponent(requesterEmail)}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch activity logs');
  return await res.json();
};
