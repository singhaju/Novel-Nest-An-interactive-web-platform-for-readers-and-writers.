import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string } | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || (session.user as any)?.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only.' });
  }

  const { commentId } = req.query;
  const id = parseInt(commentId as string);

  if (req.method === 'DELETE') {
    try {
      await prisma.comment.delete({
        where: { comment_id: id },
      });
      res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete comment.' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
