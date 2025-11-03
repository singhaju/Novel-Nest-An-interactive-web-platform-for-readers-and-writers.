import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { Comment } from '../../../../types';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Comment[] | Comment | { error: string }>
) {
  if (req.method === 'GET') {
    return getComments(req, res);
  } else if (req.method === 'POST') {
    return postComment(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getComments(req: NextApiRequest, res: NextApiResponse<Comment[] | { error: string }>) {
  const { episodeId } = req.query;
  const id = parseInt(episodeId as string);
  try {
    const comments = await prisma.comment.findMany({
      where: { episode_id: id, parent_comment_id: null }, // Fetch only top-level comments
      include: {
        user: { select: { user_id: true, username: true, profile_picture: true }},
        replies: { // Include replies
          include: { user: { select: { user_id: true, username: true, profile_picture: true }}}
        }
      },
      orderBy: { created_at: 'asc' },
    });
    res.status(200).json(comments as any);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
}

async function postComment(req: NextApiRequest, res: NextApiResponse<Comment | { error: string }>) {
  const session = await getSession({ req });
  if (!session || !(session.user as any)?.id) {
    return res.status(401).json({ error: 'You must be logged in to comment.' });
  }
  
  const { episodeId } = req.query;
  const episode_id = parseInt(episodeId as string);
  const user_id = parseInt((session.user as any).id);
  const { content, parentCommentId } = req.body;

  try {
    const newComment = await prisma.comment.create({
      data: {
        episode_id,
        user_id,
        content,
        parent_comment_id: parentCommentId ? parseInt(parentCommentId) : null,
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
}
