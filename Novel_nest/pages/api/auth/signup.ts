import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { User } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
        return res.status(409).json({ error: 'User with this email or username already exists.' });
    }
    
    // IMPORTANT: In a real app, hash the password before saving it.
    // const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password, // Store hashedPassword here
        role: 'Reader'
      },
    });

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword as User);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during sign up.' });
  }
}
