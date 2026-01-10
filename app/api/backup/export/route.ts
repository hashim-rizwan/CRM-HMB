import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all data from all tables
    const [marbles, stockTransactions, users, notifications] = await Promise.all([
      prisma.marble.findMany({
        include: {
          stockTransactions: true,
        },
      }),
      prisma.stockTransaction.findMany(),
      prisma.user.findMany(),
      prisma.notification.findMany(),
    ]);

    // Create backup object with metadata
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        marbles,
        stockTransactions,
        users: users.map(({ password, ...user }) => user), // Exclude passwords for security
        notifications,
      },
    };

    // Return as JSON with proper headers for download
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="haqeeq-marbles-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}



