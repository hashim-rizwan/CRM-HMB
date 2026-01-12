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
      await tx.reservedStock.deleteMany();
      await tx.stockEntry.deleteMany();
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

      // Restore marbles - handle both old and new backup formats
      if (backup.data.marbles && Array.isArray(backup.data.marbles)) {
        // Group marbles by marbleType to handle old format (one entry per shade)
        const marbleTypeMap = new Map<string, any>();

        for (const marble of backup.data.marbles) {
          const { stockTransactions, stockEntries, ...marbleData } = marble;
          const marbleType = marbleData.marbleType;

          if (!marbleType) continue;

          if (!marbleTypeMap.has(marbleType)) {
            // Initialize new marble type entry
            marbleTypeMap.set(marbleType, {
              marbleType,
              shadeAA: false,
              shadeA: false,
              shadeB: false,
              shadeBMinus: false,
              costPriceAA: null,
              costPriceA: null,
              costPriceB: null,
              costPriceBMinus: null,
              salePriceAA: null,
              salePriceA: null,
              salePriceB: null,
              salePriceBMinus: null,
              barcodeAA: null,
              barcodeA: null,
              barcodeB: null,
              barcodeBMinus: null,
              status: 'Out of Stock',
              notes: marbleData.notes || null,
              createdAt: marbleData.createdAt ? new Date(marbleData.createdAt) : new Date(),
              updatedAt: marbleData.updatedAt ? new Date(marbleData.updatedAt) : new Date(),
              stockEntries: [],
              stockTransactions: stockTransactions || [],
            });
          }

          const existing = marbleTypeMap.get(marbleType)!;

          // Handle old format: if color/shade is present, map it to new structure
          if (marbleData.color) {
            const shade = marbleData.color.trim();
            if (shade === 'AA') {
              existing.shadeAA = true;
              existing.costPriceAA = marbleData.costPrice || null;
              existing.salePriceAA = marbleData.salePrice || null;
              existing.barcodeAA = marbleData.barcode || null;
            } else if (shade === 'A') {
              existing.shadeA = true;
              existing.costPriceA = marbleData.costPrice || null;
              existing.salePriceA = marbleData.salePrice || null;
              existing.barcodeA = marbleData.barcode || null;
            } else if (shade === 'B') {
              existing.shadeB = true;
              existing.costPriceB = marbleData.costPrice || null;
              existing.salePriceB = marbleData.salePrice || null;
              existing.barcodeB = marbleData.barcode || null;
            } else if (shade === 'B-') {
              existing.shadeBMinus = true;
              existing.costPriceBMinus = marbleData.costPrice || null;
              existing.salePriceBMinus = marbleData.salePrice || null;
              existing.barcodeBMinus = marbleData.barcode || null;
            }

            // If quantity exists in old format, create a stock entry
            if (marbleData.quantity && marbleData.quantity > 0) {
              existing.stockEntries.push({
                shade,
                quantity: marbleData.quantity,
                slabSizeLength: null,
                slabSizeWidth: null,
                numberOfSlabs: null,
                notes: marbleData.notes || null,
                createdAt: marbleData.createdAt ? new Date(marbleData.createdAt) : new Date(),
              });
            }
          }

          // Handle new format: if shade flags are present
          if (marbleData.shadeAA !== undefined) {
            existing.shadeAA = marbleData.shadeAA || existing.shadeAA;
            existing.costPriceAA = marbleData.costPriceAA ?? existing.costPriceAA;
            existing.salePriceAA = marbleData.salePriceAA ?? existing.salePriceAA;
            existing.barcodeAA = marbleData.barcodeAA ?? existing.barcodeAA;
          }
          if (marbleData.shadeA !== undefined) {
            existing.shadeA = marbleData.shadeA || existing.shadeA;
            existing.costPriceA = marbleData.costPriceA ?? existing.costPriceA;
            existing.salePriceA = marbleData.salePriceA ?? existing.salePriceA;
            existing.barcodeA = marbleData.barcodeA ?? existing.barcodeA;
          }
          if (marbleData.shadeB !== undefined) {
            existing.shadeB = marbleData.shadeB || existing.shadeB;
            existing.costPriceB = marbleData.costPriceB ?? existing.costPriceB;
            existing.salePriceB = marbleData.salePriceB ?? existing.salePriceB;
            existing.barcodeB = marbleData.barcodeB ?? existing.barcodeB;
          }
          if (marbleData.shadeBMinus !== undefined) {
            existing.shadeBMinus = marbleData.shadeBMinus || existing.shadeBMinus;
            existing.costPriceBMinus = marbleData.costPriceBMinus ?? existing.costPriceBMinus;
            existing.salePriceBMinus = marbleData.salePriceBMinus ?? existing.salePriceBMinus;
            existing.barcodeBMinus = marbleData.barcodeBMinus ?? existing.barcodeBMinus;
          }

          // Update status if provided
          if (marbleData.status) {
            existing.status = marbleData.status;
          }

          // Merge stock entries if present in new format
          if (stockEntries && Array.isArray(stockEntries)) {
            existing.stockEntries.push(...stockEntries);
          }
        }

        // Create marbles and their stock entries
        for (const [marbleType, marbleData] of marbleTypeMap.entries()) {
          const { stockEntries, stockTransactions, ...marbleCreateData } = marbleData;

          // Calculate status based on stock entries if not set
          let status = marbleCreateData.status;
          const totalQuantity = stockEntries.reduce((sum: number, e: any) => sum + (e.quantity || 0), 0);
          if (totalQuantity === 0) {
            status = 'Out of Stock';
          } else if (totalQuantity < 100) {
            status = 'Low Stock';
          } else {
            status = 'In Stock';
          }

          const createdMarble = await tx.marble.create({
            data: {
              ...marbleCreateData,
              status,
            },
          });

          // Create stock entries
          for (const entry of stockEntries) {
            await tx.stockEntry.create({
              data: {
                marbleId: createdMarble.id,
                shade: entry.shade,
                quantity: entry.quantity,
                slabSizeLength: entry.slabSizeLength || null,
                slabSizeWidth: entry.slabSizeWidth || null,
                numberOfSlabs: entry.numberOfSlabs || null,
                notes: entry.notes || null,
                createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
              },
            });
          }

          // Store stock transactions for later (need marbleId)
          if (stockTransactions && Array.isArray(stockTransactions)) {
            for (const transaction of stockTransactions) {
              await tx.stockTransaction.create({
                data: {
                  marbleId: createdMarble.id,
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
      }

      // Restore stock transactions (if not already restored with marbles)
      if (backup.data.stockTransactions && Array.isArray(backup.data.stockTransactions)) {
        for (const transaction of backup.data.stockTransactions) {
          // Try to find marble by ID first, then by marbleType if ID doesn't match
          let marble = await tx.marble.findUnique({
            where: { id: transaction.marbleId },
          });

          // If not found by ID, try to find by marbleType (for old backups)
          if (!marble && transaction.marble) {
            marble = await tx.marble.findUnique({
              where: { marbleType: transaction.marble.marbleType },
            });
          }

          if (marble) {
            await tx.stockTransaction.create({
              data: {
                marbleId: marble.id,
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
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: `Failed to restore backup: ${error.message || 'Please ensure the backup file is valid.'}` },
      { status: 500 }
    );
  }
}
