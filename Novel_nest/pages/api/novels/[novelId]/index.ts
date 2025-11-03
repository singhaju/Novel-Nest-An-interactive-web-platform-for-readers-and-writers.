import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { Novel } from '../../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Novel | { error: string }>
) {
  const { novelId } = req.query;
  const id = parseInt(novelId as string);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const novel = await prisma.novel.findUnique({
      where: { novel_id: id },
      include: {
        authors: {
          select: {
            user: {
              select: {
                user_id: true,
                username: true,
              }
            }
          }
        }
      },
    });

    if (!novel) {
      return res.status(404).json({ error: 'Novel not found' });
    }
    
    const formattedNovel = {
      ...novel,
      author: novel.authors[0]?.user ?? { user_id: 0, username: 'Unknown' },
    }

    res.status(200).json(formattedNovel as any);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch novel details' });
  }
}
