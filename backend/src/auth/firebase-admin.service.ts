import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('⚠️ Firebase Admin not configured (missing FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY). Google login will be disabled.');
      return;
    }

    try {
      this.app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log(`🔥 Firebase Admin initialized (project: ${projectId})`);
    } catch (err: any) {
      this.logger.error(`❌ Firebase Admin init failed: ${err.message}`);
    }
  }

  /**
   * Verify Firebase ID Token from frontend.
   * Returns decoded token with uid, email, name, picture.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
    if (!this.app) {
      this.logger.warn('Firebase Admin not initialized. Cannot verify token.');
      return null;
    }

    try {
      const decoded = await getAuth(this.app).verifyIdToken(idToken);
      return decoded;
    } catch (err: any) {
      this.logger.error(`Firebase token verification failed: ${err.message}`);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.app !== null;
  }
}
