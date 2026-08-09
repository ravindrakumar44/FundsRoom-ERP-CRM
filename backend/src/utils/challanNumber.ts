import { prisma } from '../config/prisma';

/**
 * Generates the next sequential unique challan number
 * Format: CH-YYYY-XXXXX (e.g. CH-2026-00001)
 */
export const generateChallanNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `CH-${currentYear}-`;

  // Find the highest challan number for the current year
  const latestChallan = await prisma.challan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      challanNumber: 'desc',
    },
    select: {
      challanNumber: true,
    },
  });

  if (!latestChallan) {
    return `${prefix}00001`;
  }

  const parts = latestChallan.challanNumber.split('-');
  const lastSeq = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  const paddedSeq = String(nextSeq).padStart(5, '0');

  return `${prefix}${paddedSeq}`;
};
