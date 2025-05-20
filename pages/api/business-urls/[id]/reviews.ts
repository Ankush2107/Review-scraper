import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth].ts'; 
import dbConnect from '@/lib/mongodb';
import * as storage from '@/lib/storage';
import { IReviewItem } from '@/models/Review.model'; 
import { Types } from 'mongoose';

interface ReviewsApiResponse {
  reviews?: IReviewItem[];
  message?: string;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReviewsApiResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  };
  console.log(`[API /api/business-urls/[id]/reviews] Received request for ID: ${req.query.id}`);
  try {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      console.log("[API .../[id]/reviews] Unauthorized: No session or user ID.");
      return res.status(401).json({ message: 'Unauthorized' });
    };
    const userId_string = session.user.id as string;
    const { id: businessUrlId_param, limit: limitQuery } = req.query;
    if (typeof businessUrlId_param !== 'string' || !businessUrlId_param) {
      console.log("[API .../[id]/reviews] Bad Request: businessUrlId_param missing or not string.");
      return res.status(400).json({ message: 'Bad Request: Business URL ID is required.' });
    };
    if (!Types.ObjectId.isValid(businessUrlId_param)) {
      console.log("[API .../[id]/reviews] Bad Request: Invalid Business URL ID format:", businessUrlId_param);
      return res.status(400).json({ message: 'Bad Request: Invalid Business URL ID format.' });
    };
    const businessUrl = await storage.getBusinessUrlById(businessUrlId_param);
    if (!businessUrl) {
      console.log("[API .../[id]/reviews] Not Found: Business URL not found for ID:", businessUrlId_param);
      return res.status(404).json({ message: 'Business URL not found.' });
    };
    if (businessUrl.userId.toString() !== userId_string) {
      console.log(`[API .../[id]/reviews] Forbidden: User ${userId_string} does not own business URL ${businessUrlId_param}`);
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access these reviews.' });
    };
    const limit = typeof limitQuery === 'string' && !isNaN(parseInt(limitQuery))
      ? parseInt(limitQuery) : 10;
    console.log(`[API .../[id]/reviews] Fetching review batch for businessUrlId: ${businessUrlId_param}, source: ${businessUrl.source}`);
    const reviewBatchDoc = await storage.getReviewBatchForBusinessUrl(businessUrlId_param, businessUrl.source);
    if (!reviewBatchDoc || !reviewBatchDoc.reviews || reviewBatchDoc.reviews.length === 0) {
      console.log(`[API .../[id]/reviews] No review batch found or no reviews in batch for ID: ${businessUrlId_param}`);
      return res.status(200).json({ reviews: [] });
    };
    console.log(`[API .../[id]/reviews] Found ${reviewBatchDoc.reviews.length} reviews in batch. Applying limit.`);
    const reviewsToReturn = reviewBatchDoc.reviews.slice(0, limit);
    console.log(`[API .../[id]/reviews] Returning ${reviewsToReturn.length} reviews.`);
    return res.status(200).json({ reviews: reviewsToReturn });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`API Error in /api/business-urls/[id]/reviews for ID [${req.query.id}]:`, err.message, err.stack);
    return res.status(500).json({ message: err.message || "Server error fetching reviews." });
  }
};