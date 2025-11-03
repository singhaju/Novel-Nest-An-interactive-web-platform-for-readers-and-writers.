import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { Review } from '../../../../types';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Review[] | Review | { error: string }>
) {
  const { novelId } = req.query;
  const id = parseInt(novelId as string);

  if (req.method === 'GET') {
    try {
      const reviews = await prisma.review.findMany({
        where: { novel_id: id },
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              profile_picture: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      res.status(200).json(reviews as any);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  } else if (req.method === 'POST') {
    const session = await getSession({ req });
    if (!session || !(session.user as any)?.id) {
        return res.status(401).json({ error: 'You must be logged in to post a review.' });
    }
    
    const { rating, comment } = req.body;
    const userId = parseInt((session.user as any).id);

    try {
        const newReview = await prisma.review.create({
            data: {
                novel_id: id,
                user_id: userId,
                rating,
                comment,
            }
        });

        // Trigger logic: Recalculate average rating
        const allRatings = await prisma.review.findMany({
            where: { novel_id: id },
            select: { rating: true }
        });

        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

        await prisma.novel.update({
            where: { novel_id: id },
            data: { rating: parseFloat(avgRating.toFixed(2)) }
        });

        res.status(201).json(newReview);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to post review.' });
    }

  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
