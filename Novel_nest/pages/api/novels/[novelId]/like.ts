import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ liked: boolean; likesCount: number } | { error: string }>
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
    const existingLike = await prisma.like.findUnique({
      where: { user_id_novel_id: { user_id, novel_id } },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({ where: { user_id_novel_id: { user_id, novel_id } } });
      
      const updatedNovel = await prisma.novel.update({
          where: { novel_id },
          data: { likes: { decrement: 1 } }
      });
      
      res.status(200).json({ liked: false, likesCount: updatedNovel.likes });
    } else {
      // Like
      await prisma.like.create({ data: { user_id, novel_id } });

      const updatedNovel = await prisma.novel.update({
        where: { novel_id },
        data: { likes: { increment: 1 } }
      });

      res.status(200).json({ liked: true, likesCount: updatedNovel.likes });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred.' });
  }
}
