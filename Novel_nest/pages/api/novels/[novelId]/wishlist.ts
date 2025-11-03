import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ wishlisted: boolean } | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || !(session.user as any)?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const novel_id = parseInt(req.query.novelId as string);
  const user_id = parseInt((session.user as any).id);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const existingWish = await prisma.userWishlist.findUnique({
      where: { user_id_novel_id: { user_id, novel_id } },
    });

    if (existingWish) {
      await prisma.userWishlist.delete({ where: { user_id_novel_id: { user_id, novel_id } } });
      res.status(200).json({ wishlisted: false });
    } else {
      await prisma.userWishlist.create({ data: { user_id, novel_id } });
      res.status(200).json({ wishlisted: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred.' });
  }
}
