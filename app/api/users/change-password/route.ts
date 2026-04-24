import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { responseIfDatabaseUnavailable } from '@/lib/prismaErrors';

export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Username, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password — supports both bcrypt hashes and legacy plain-text
    const isHashed = user.password.startsWith('$2');
    const currentMatch = isHashed
      ? await bcrypt.compare(currentPassword, user.password)
      : user.password === currentPassword;

    if (!currentMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Ensure new password differs from current
    const sameAsNew = isHashed
      ? await bcrypt.compare(newPassword, user.password)
      : user.password === newPassword;

    if (sameAsNew) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { username },
      data: {
        password: hashedNew,
        lastActive: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    const dbError = responseIfDatabaseUnavailable(error);
    if (dbError) return dbError;
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}



