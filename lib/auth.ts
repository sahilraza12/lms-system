import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt-secret';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  studentId?: string | null;
  centerId?: string | null;
  teacherId?: string | null;
  fullName?: string;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('viq-session')?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
    return decoded;
  } catch {
    return null;
  }
}