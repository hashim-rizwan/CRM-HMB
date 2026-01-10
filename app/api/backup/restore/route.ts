import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const backup = await request.json();

    // Validate backup structure
    if (!backup.data || !backup.version) {
      return NextResponse.json(
        { error: 'Invalid backup file format' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all-or-nothing restore
    await prisma.$transaction(async (tx) => {
      // Clear existing data (in reverse order of dependencies)
      await tx.stockTransaction.deleteMany();
      await tx.marble.deleteMany();
      await tx.notification.deleteMany();
      await tx.user.deleteMany();

      // Restore users (passwords are excluded from backup for security, so we'll need to handle this)
      if (backup.data.users && Array.isArray(backup.data.users)) {
        for (const user of backup.data.users) {
          // If password is not in backup (for security), set a temporary one
          // Users will need to reset their passwords after restore
          await tx.user.create({
            data: {
              username: user.username,
              password: user.password || 'temp123', // Temporary password - users should reset
              fullName: user.fullName,
              email: user.email,
              phone: user.phone || null,
              role: user.role || 'Staff',
              status: user.status || 'Active',
              department: user.department || null,
              joinedDate: user.joinedDate ? new Date(user.joinedDate) : new Date(),
              lastActive: user.lastActive ? new Date(user.lastActive) : new Date(),
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            },
          });
        }
      }

      // Restore marbles first (before stock transactions which reference them)
      if (backup.data.marbles && Array.isArray(backup.data.marbles)) {
        for (const marble of backup.data.marbles) {
          const { stockTransactions, ...marbleData } = marble;
          await tx.marble.create({
            data: {
              marbleType: marbleData.marbleType,
              color: marbleData.color,
              quantity: marbleData.quantity || 0,
              unit: marbleData.unit || 'square feet',
              location: marbleData.location,
              supplier: marbleData.supplier || null,
              batchNumber: marbleData.batchNumber || null,
              barcode: marbleData.barcode || null,
              costPrice: marbleData.costPrice || null,
              salePrice: marbleData.salePrice || null,
              status: marbleData.status || 'In Stock',
              notes: marbleData.notes || null,
              createdAt: marbleData.createdAt ? new Date(marbleData.createdAt) : new Date(),
              updatedAt: marbleData.updatedAt ? new Date(marbleData.updatedAt) : new Date(),
            },
          });
        }
      }

      // Restore stock transactions (after marbles are created)
      if (backup.data.stockTransactions && Array.isArray(backup.data.stockTransactions)) {
        for (const transaction of backup.data.stockTransactions) {
          // Verify the marble exists before creating transaction
          const marble = await tx.marble.findUnique({
            where: { id: transaction.marbleId },
          });
          
          if (marble) {
            await tx.stockTransaction.create({
              data: {
                marbleId: transaction.marbleId,
                type: transaction.type,
                quantity: transaction.quantity,
                reason: transaction.reason || null,
                requestedBy: transaction.requestedBy || null,
                notes: transaction.notes || null,
                createdAt: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
              },
            });
          }
        }
      }

      // Restore notifications
      if (backup.data.notifications && Array.isArray(backup.data.notifications)) {
        for (const notification of backup.data.notifications) {
          await tx.notification.create({
            data: {
              type: notification.type,
              message: notification.message,
              read: notification.read || false,
              createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup. Please ensure the backup file is valid.' },
      { status: 500 }
    );
  }
}

