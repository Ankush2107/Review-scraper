import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; 
import * as storage from '../../../lib/storage';
import { businessUrlSchema } from '../../../lib/schemas/businessUrl'; 
import { ZodError } from 'zod';
import { handleZodError } from '../../../lib/utils';
import dbConnect from '../../../lib/mongodb';
import { IBusinessUrl } from '../../../models/BusinessUrl.model'

interface ErrorResponse {
  message: string;
  errors?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IBusinessUrl[] | IBusinessUrl | ErrorResponse | { message: string }>
) {
  try {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ message: 'Unauthorized: Not authenticated.' });
    }
    const userId_string = session.user.id as string;
    if (req.method === 'GET') {
      const businessUrls = await storage.getBusinessUrlsByUserId(userId_string);
      return res.status(200).json(businessUrls);
    } else if (req.method === 'POST') {
      const businessUrlData = businessUrlSchema.parse(req.body); 
      const newBusinessUrl = await storage.createBusinessUrl({
        ...businessUrlData,
        userId: userId_string,
      });
      return res.status(201).json(newBusinessUrl);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json(handleZodError(error));
    }
    console.error(`API Error in /api/business-urls for method ${req.method}:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    if (error instanceof Error && error.message.toLowerCase().includes("already been added")) {
        return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message });
  }
}