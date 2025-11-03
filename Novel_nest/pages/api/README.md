# Novel Nest API Backend

This directory (`/pages/api`) contains the entire backend logic for the Novel Nest application, built using **Next.js API Routes**.

Each file or folder inside this directory becomes a distinct API endpoint that the frontend can call. This serverless approach simplifies development by keeping the frontend and backend in a single, cohesive project.

## Tech Stack

- **Next.js API Routes**: The framework for creating server-side functions.
- **Prisma**: The Object-Relational Mapper (ORM) used to interact with the database in a type-safe way. The database schema is defined in `/prisma/schema.prisma`.
- **NextAuth.js**: Handles user authentication and session management. The configuration is located in `/pages/api/auth/[...nextauth].ts`.

## How It Works

1.  **Request**: The frontend application (e.g., from `services/apiService.ts`) sends an HTTP request (like `GET`, `POST`, `PUT`) to a URL like `/api/novels`.
2.  **Routing**: Next.js automatically maps this request to the corresponding file, e.g., `/pages/api/novels/index.ts`.
3.  **Execution**: The default exported `handler` function in that file is executed.
4.  **Database Interaction**: Inside the handler, we use the `prisma` client (`/lib/prisma.ts`) to perform database operations (querying, creating, updating records).
5.  **Response**: The handler sends back a JSON response to the frontend with the requested data or a success/error message.

## Creating a New Endpoint

To add a new function, simply create a new TypeScript file in this directory. For example, to create an endpoint for searching novels, you could create `/pages/api/search.ts`:

```typescript
// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query; // e.g., /api/search?query=dragon

  const results = await prisma.novel.findMany({
    where: {
      title: {
        contains: query as string,
        mode: 'insensitive',
      },
    },
  });

  res.status(200).json(results);
}
```
