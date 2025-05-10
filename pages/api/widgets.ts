// pages/api/widgets.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import * as storage from '@/lib/storage';
import { IWidget } from '@/models/Widget.model'; 

interface WidgetsResponse {
  widgets?: IWidget[];
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WidgetsResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = session.user.id as string; 
    const widgets = await storage.getWidgetsByUserId(userId);

    return res.status(200).json({ widgets });

  } catch (error: unknown) {
    console.error("API Error in /api/widgets:", error);
    const message = error instanceof Error ? error.message : "Server error fetching widgets.";
    return res.status(500).json({ message });
  }
}