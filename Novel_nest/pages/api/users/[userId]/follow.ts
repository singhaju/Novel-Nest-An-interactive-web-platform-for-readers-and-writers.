import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ following: boolean } | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || !(session.user as any)?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const follower_id = parseInt((session.user as any).id);
  const following_id = parseInt(req.query.userId as string);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (follower_id === following_id) {
    return res.status(400).json({ error: 'You cannot follow yourself.' });
  }

  try {
    const existingFollow = await prisma.userFollows.findUnique({
      where: { follower_id_following_id: { follower_id, following_id } },
    });

    if (existingFollow) {
      await prisma.userFollows.delete({ where: { follower_id_following_id: { follower_id, following_id } } });
      res.status(200).json({ following: false });
    } else {
      await prisma.userFollows.create({ data: { follower_id, following_id } });
      res.status(200).json({ following: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred.' });
  }
}
