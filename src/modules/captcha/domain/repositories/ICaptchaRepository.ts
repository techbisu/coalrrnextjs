import { captcha_challenge, Prisma } from '@prisma/client';

export interface ICaptchaRepository {
  saveChallenge(data: Prisma.captcha_challengeCreateInput): Promise<captcha_challenge>;
  getChallenge(id: string): Promise<captcha_challenge | null>;
  incrementAttempts(id: string): Promise<captcha_challenge>;
  deleteChallenge(id: string): Promise<void>;
  expireOldChallenges(): Promise<void>;
}
