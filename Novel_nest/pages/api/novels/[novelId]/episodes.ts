import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { Episode } from '../../../../types';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Episode[] | Episode | { error: string }>
) {
  if (req.method === 'GET') {
    return getEpisodes(req, res);
  } else if (req.method === 'POST') {
    return createEpisode(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getEpisodes(req: NextApiRequest, res: NextApiResponse<Episode[] | { error: string }>) {
    const { novelId } = req.query;
    const id = parseInt(novelId as string);

    try {
        const episodes = await prisma.episode.findMany({
            where: { novel_id: id },
            orderBy: { release_date: 'asc' },
        });
        res.status(200).json(episodes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch episodes' });
    }
}

async function createEpisode(req: NextApiRequest, res: NextApiResponse<Episode | { error: string }>) {
    const session = await getSession({ req });
    if (!session || !(session.user as any)?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { novelId } = req.query;
    const novel_id = parseInt(novelId as string);
    const userId = parseInt((session.user as any).id);
    const { title, content, is_locked, price } = req.body;
    
    // Authorization: Check if user is an author of this novel
    const novelAuthor = await prisma.novelAuthors.findUnique({
        where: { user_id_novel_id: { user_id: userId, novel_id } }
    });

    if (!novelAuthor && (session.user as any).role !== 'Admin') {
        return res.status(403).json({ error: 'You are not an author of this novel.' });
    }

    try {
        const newEpisode = await prisma.episode.create({
            data: {
                novel_id,
                title,
                content,
                is_locked: is_locked || false,
                price: is_locked ? price : null,
            }
        });
        
        // Trigger: Update novel's last_update timestamp
        await prisma.novel.update({
            where: { novel_id },
            data: { last_update: new Date() }
        });

        res.status(201).json(newEpisode);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create episode.' });
    }
}
