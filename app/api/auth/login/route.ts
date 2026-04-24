import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDatabaseUnavailable, DB_UNAVAILABLE_USER_MESSAGE } from '@/lib/prismaErrors';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    // Do not trim password — leading/trailing spaces may be intentional
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Case-insensitive username (avoids 401 when DB has "admin" and user types "Admin")
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is disabled
    if (user.status === 'Disabled') {
      return NextResponse.json(
        { error: 'Your account has been disabled. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Verify password — supports both bcrypt hashes and legacy plain-text.
    // On a plain-text match we re-hash transparently so the account is migrated.
    const isHashed = user.password.startsWith('$2');
    const passwordMatch = isHashed
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Migrate plain-text password to bcrypt on successful login
    if (!isHashed) {
      const hashed = await bcrypt.hash(password, 12);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    }

    // Update lastActive timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error during login:', error);
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ error: DB_UNAVAILABLE_USER_MESSAGE }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}







