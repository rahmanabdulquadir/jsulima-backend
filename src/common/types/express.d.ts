// src/@types/express.d.ts
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      sub: string;
      role: UserRole | string; 
    }

    interface Request {
      user?: User;
    }
  }
}
