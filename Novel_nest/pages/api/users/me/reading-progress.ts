import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string } | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || !(session.user as any)?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user_id = parseInt((session.user as any).id);
  const { novelId, episodeId } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await prisma.userReadingProgress.upsert({
      where: {
        user_id_novel_id: {
          user_id: user_id,
          novel_id: novelId,
        },
      },
      update: {
        last_read_episode_id: episodeId,
      },
      create: {
        user_id: user_id,
        novel_id: novelId,
        last_read_episode_id: episodeId,
      },
    });

    res.status(200).json({ message: 'Progress saved.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save reading progress.' });
  }
}
