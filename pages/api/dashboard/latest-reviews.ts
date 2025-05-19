import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; 
import dbConnect from '@/lib/mongodb';
import * as storage from '@/lib/storage';
import { IReviewItem } from '@/models/Review.model'
interface LatestReviewResponseItem extends IReviewItem {
    businessName: string;
    source: 'google' | 'facebook'; 
    businessUrl: string; 
}

interface LatestReviewsResponse {
  reviews?: LatestReviewResponseItem[];
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LatestReviewsResponse>
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

    const limitQuery = req.query.limit;
    const limit = typeof limitQuery === 'string' && !isNaN(parseInt(limitQuery))
      ? parseInt(limitQuery)
      : 10; 
    const latestReviews = await storage.getLatestReviews(userId, limit);

    return res.status(200).json({ reviews: latestReviews as LatestReviewResponseItem[] });

  } catch (error: unknown) {
    console.error("API Error in /api/dashboard/latest-reviews:", error);
    const message = error instanceof Error ? error.message : "Server error fetching latest reviews.";
    return res.status(500).json({ message });
  }
}