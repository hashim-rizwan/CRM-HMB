import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export const DB_UNAVAILABLE_USER_MESSAGE =
  'Cannot reach the database. Check your network, VPN, and DATABASE_URL, and that the database (e.g. Supabase) is not paused.';

export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1003', 'P1017'].includes(error.code);
  }
  if (error instanceof Error) {
    return /Can't reach database|server has closed the connection|Connection timed out|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(
      error.message
    );
  }
  return false;
}

/** Use in API route catch blocks: `const r = responseIfDatabaseUnavailable(error); if (r) return r;` */
export function responseIfDatabaseUnavailable(error: unknown): NextResponse | null {
  if (!isDatabaseUnavailable(error)) return null;
  return NextResponse.json(
    { error: DB_UNAVAILABLE_USER_MESSAGE, success: false },
    { status: 503 }
  );
}
