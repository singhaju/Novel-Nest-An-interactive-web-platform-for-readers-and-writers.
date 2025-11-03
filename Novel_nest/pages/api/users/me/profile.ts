import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'next-auth/react';
import { User } from '../../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User | { error: string }>
) {
  const session = await getSession({ req });
  if (!session || !(session.user as any)?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user_id = parseInt((session.user as any).id);

  if (req.method === 'PUT') {
    const { bio, profile_picture } = req.body;
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id },
        data: {
          bio: bio,
          profile_picture: profile_picture,
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword as User);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
