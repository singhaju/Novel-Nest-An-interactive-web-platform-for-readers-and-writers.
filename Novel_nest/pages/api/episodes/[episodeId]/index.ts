import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { Episode } from '../../../../types';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Episode | { error: string }>
) {
  const { episodeId } = req.query;
  const id = parseInt(episodeId as string);

  if (req.method === 'GET') {
    return getEpisode(req, res, id);
  } else if (req.method === 'PUT') {
    return updateEpisode(req, res, id);
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getEpisode(req: NextApiRequest, res: NextApiResponse<Episode | { error: string }>, id: number) {
    try {
        const episode = await prisma.episode.findUnique({ where: { episode_id: id }});
        if (!episode) return res.status(404).json({ error: 'Episode not found.' });

        // Future logic: check if episode is locked and user has purchased it
        res.status(200).json(episode);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch episode.' });
    }
}

async function updateEpisode(req: NextApiRequest, res: NextApiResponse<Episode | { error: string }>, id: number) {
    const session = await getSession({ req });
    if (!session || !(session.user as any)?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = parseInt((session.user as any).id);

    try {
        const episode = await prisma.episode.findUnique({
             where: { episode_id: id },
             include: { novel: { include: { authors: true } } }
        });

        if (!episode) return res.status(404).json({ error: 'Episode not found.' });

        const isAuthor = episode.novel.authors.some(a => a.user_id === userId);
        if (!isAuthor && (session.user as any).role !== 'Admin') {
            return res.status(403).json({ error: 'You are not an author of this novel.' });
        }

        const updatedEpisode = await prisma.episode.update({
            where: { episode_id: id },
            data: req.body, // Assumes body contains fields to update, e.g., { title, content }
        });
        res.status(200).json(updatedEpisode);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update episode.' });
    }
}
