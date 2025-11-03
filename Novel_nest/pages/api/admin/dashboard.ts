import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || (session.user as any)?.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only.' });
  }

  try {
    const [userCount, novelCount, pendingNovels, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.novel.count(),
      prisma.novel.count({ where: { status: 'PendingApproval' } }),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
    ]);

    res.status(200).json({
      totalUsers: userCount,
      totalNovels: novelCount,
      pendingReviews: pendingNovels, // Using this field name from UI mock
      revenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard data.' });
  }
}
