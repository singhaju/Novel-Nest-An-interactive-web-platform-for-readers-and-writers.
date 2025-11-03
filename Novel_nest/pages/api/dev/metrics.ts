import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | { error: string }>
) {
    const session = await getSession({ req });
    if (!session || (session.user as any)?.role !== 'Developer') {
        return res.status(403).json({ error: 'Forbidden: Developers only.' });
    }

    // This returns mock data as the real metrics are system-level
    // and not accessible in this environment.
    res.status(200).json({
        databaseSize: "0.7TB",
        totalRecords: 585, // Mocked, a real call would be prisma.user.count() etc.
        transactions: 36447,
        userContent: 6749,
        serverMetrics: {
            cpuUsage: "53.1%",
            memoryUsage: "75.6%",
            diskUsage: "19.7%",
            activeConnections: 570,
            requestsPerMinute: 1277,
            uptime: "15 days, 23 hours"
        }
    });
}
