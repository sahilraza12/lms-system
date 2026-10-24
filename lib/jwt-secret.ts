const DEVELOPMENT_JWT_SECRET = 'viq-lms-development-only-secret-change-before-production';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production.');
    }
    return DEVELOPMENT_JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }

  return secret;
}
