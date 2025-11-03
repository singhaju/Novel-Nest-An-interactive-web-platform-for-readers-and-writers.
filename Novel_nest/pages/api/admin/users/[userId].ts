import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';
import { User } from '../../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || (session.user as any)?.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only.' });
  }

  const { userId } = req.query;
  const id = parseInt(userId as string);

  if (req.method === 'PUT') {
    const { role, status } = req.body; // In the schema, status is on Novel, not user. We can manage role.
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: id },
        data: {
          role: role, // e.g., 'Writer', 'Reader'
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword as User);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update user.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
