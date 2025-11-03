import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || !(session.user as any)?.id || (session.user as any)?.role !== 'Writer') {
    return res.status(403).json({ error: 'Forbidden: Writers only.' });
  }
  const writerId = parseInt((session.user as any).id);

  try {
    const writerNovels = await prisma.novel.findMany({
        where: { authors: { some: { user_id: writerId } } },
        select: {
            novel_id: true,
            views: true,
            episodes: {
                select: {
                    episode_id: true
                }
            }
        }
    });

    const totalNovels = writerNovels.length;
    const totalViews = writerNovels.reduce((sum, novel) => sum + novel.views, 0);
    const totalEpisodes = writerNovels.reduce((sum, novel) => sum + novel.episodes.length, 0);

    // Mock earnings and notifications as per the schema
    const earnings = await prisma.writerEarning.aggregate({
        where: { writer_id: writerId },
        _sum: { amount: true }
    });
    
    const newNotifications = await prisma.notification.count({
        where: { user_id: writerId, is_read: false }
    });


    res.status(200).json({
      totalNovels,
      totalEpisodes,
      totalViews,
      coinsEarned: earnings._sum.amount || 0,
      notifications: newNotifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch writer dashboard data.' });
  }
}
