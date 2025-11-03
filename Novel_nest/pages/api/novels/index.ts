import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { Novel } from '../../../types';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Novel[] | Novel | { error: string }>
) {
  if (req.method === 'GET') {
    return getNovels(req, res);
  } else if (req.method === 'POST') {
    return createNovel(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getNovels(req: NextApiRequest, res: NextApiResponse<Novel[] | { error: string }>) {
  // FIX: Added authorId to query parameters to allow filtering by author.
  const { genre, tag, status, orderBy, authorId } = req.query;

  try {
    const novels = await prisma.novel.findMany({
      where: {
        status: status ? (status as any) : undefined,
        tags: genre ? { has: genre as string } : (tag ? { has: tag as string } : undefined),
        // FIX: Added filtering logic for authorId.
        authors: authorId ? { some: { user_id: parseInt(authorId as string) } } : undefined,
      },
      include: {
        authors: {
          select: {
            user: {
              select: {
                user_id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        [orderBy === 'rating' ? 'rating' : 'views']: 'desc',
      },
      take: 20,
    });

    const formattedNovels = novels.map(n => ({
      ...n,
      author: n.authors[0]?.user ?? { user_id: 0, username: 'Unknown' },
      tags: n.tags || [],
    }));

    res.status(200).json(formattedNovels as any);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch novels' });
  }
}

async function createNovel(req: NextApiRequest, res: NextApiResponse<Novel | { error: string }>) {
    const session = await getSession({ req });
    if (!session || !(session.user as any)?.id || (session.user as any)?.role !== 'Writer') {
        return res.status(403).json({ error: 'You must be a writer to create a novel.' });
    }

    const { title, description, tags, cover_image } = req.body;
    const userId = parseInt((session.user as any).id);

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required.' });
    }

    try {
        const newNovel = await prisma.novel.create({
            data: {
                title,
                description,
                tags: tags || [],
                cover_image,
                status: 'PendingApproval',
                authors: {
                    create: {
                        user_id: userId,
                        author_role: 'Primary Author'
                    }
                }
            },
            include: {
              authors: { include: { user: true } }
            }
        });

        const formattedNovel = {
            ...newNovel,
            author: newNovel.authors[0]?.user ?? { user_id: 0, username: 'Unknown' },
            tags: newNovel.tags || [],
        };

        res.status(201).json(formattedNovel as any);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create novel.' });
    }
}