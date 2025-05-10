import dbConnect from './mongodb';
import UserModel, { IUser } from '../models/User.model';

import BusinessUrlModel, { IBusinessUrl } from '../models/BusinessUrl.model';
import ReviewBatchModel, { IReviewBatch, IReviewItem } from '../models/Review.model';
import WidgetModel, { IWidget } from '../models/Widget.model';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Types, UpdateQuery  } from 'mongoose';

interface IBusinessStats {
  totalBusinessUrls: number;
  totalWidgets: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  reviewsBySource: {
    google: number;
    facebook: number;
  };
}

async function ensureDbConnected() {
  await dbConnect();
}
export const getUserById = async (id: string): Promise<IUser | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return null;
  return UserModel.findById(id).exec();
};

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  console.log(`[Storage/getUserByEmail] Attempting to connect to DB...`);
  await ensureDbConnected(); 
  console.log(`[Storage/getUserByEmail] DB Connected. Searching for email: "${email}"`);
  const processedEmail = email.toLowerCase().trim(); 
  console.log(`[Storage/getUserByEmail] Processed email for query: "${processedEmail}"`);
  try {
    const anyUser = await UserModel.findOne().select('+password').lean().exec();
    console.log(`[Storage/getUserByEmail] Sample user found (test query):`, anyUser ? { email: anyUser.email, _id: anyUser._id } : null);
    const user = await UserModel.findOne({ email: processedEmail })
      .select('+password') 
      .lean() 
      .exec();

    console.log(`[Storage/getUserByEmail] Mongoose findOne result for "${processedEmail}":`, user);
    if (user) {
      console.log(`[Storage/getUserByEmail] User found:`, { _id: user._id, email: user.email, hasPassword: !!user.password });
      return user as IUser; 
    } else {
      console.log(`[Storage/getUserByEmail] No user found with email: "${processedEmail}"`);
      const allUsers = await UserModel.find({}).select('email fullName').lean().exec();
      console.log('[Storage/getUserByEmail] All emails in DB:', allUsers.map(u => u.email));
      return null;
    }
  } catch (error) {
    console.error(`[Storage/getUserByEmail] Error during database query for email "${processedEmail}":`, error);
    throw error; 
  }
};

export const getUserByUsername = async (username: string): Promise<IUser | null> => {
  await ensureDbConnected();
  return UserModel.findOne({ username }).select('+password').exec();
};

interface CreateUserArgs {
  email: string;
  password?: string; 
  fullName?: string;
  username?: string;
  isVerified?: boolean;
}
export const createUser = async (userData: CreateUserArgs): Promise<IUser> => {
  await ensureDbConnected();
  if (!userData.password) throw new Error("Password is required to create user.");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  const userToSave = new UserModel({
    ...userData,
    email: userData.email.toLowerCase(),
    password: hashedPassword,
    isVerified: userData.isVerified === undefined ? true : userData.isVerified, 
  });
  const savedUser = await userToSave.save();
  const userObject = savedUser.toObject();
  delete userObject.password;
  return userObject as IUser;
};

export const comparePassword = async (password: string, hashedPassword?: string): Promise<boolean> => {
  if (!hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
};

export const getBusinessUrlById = async (id: string): Promise<IBusinessUrl | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return null;
  return BusinessUrlModel.findById(id).exec();
};

export const getBusinessUrlByUrlHash = async (urlHash: string): Promise<IBusinessUrl | null> => {
  await ensureDbConnected();
  return BusinessUrlModel.findOne({ urlHash }).exec();
};

export const getBusinessUrlsByUserId = async (userId: string): Promise<IBusinessUrl[]> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(userId)) return [];
  return BusinessUrlModel.find({ userId: new Types.ObjectId(userId) }).sort({ addedAt: -1 }).lean().exec();
};

interface CreateBusinessUrlArgs {
  userId: string;
  name: string;
  url: string;
  source: 'google' | 'facebook';
}
export const createBusinessUrl = async (data: CreateBusinessUrlArgs): Promise<IBusinessUrl> => {
  await ensureDbConnected();
  const urlHash = crypto.createHash('md5').update(data.url).digest('hex');
  const existingUrl = await BusinessUrlModel.findOne({ urlHash });
  if (existingUrl) {
    throw new Error("This business URL has already been added by another user.");
  }
  const newBusinessUrl = new BusinessUrlModel({
    ...data,
    userId: new Types.ObjectId(data.userId),
    urlHash,
  });
  return newBusinessUrl.save();
};

export const updateBusinessUrlScrapedTime = async (id: string): Promise<IBusinessUrl | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return null;
  return BusinessUrlModel.findByIdAndUpdate(
    id,
    { $set: { lastScrapedAt: new Date() } },
    { new: true }
  ).exec();
};

interface GetReviewsOptions {
  limit?: number;    
  offset?: number;   
  minRating?: number;
}
export const getReviewBatchForBusinessUrl = async (
  businessUrlId: string,
  source: 'google' | 'facebook'
): Promise<IReviewBatch | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(businessUrlId)) return null;
  return ReviewBatchModel.findOne({
    businessUrlId: new Types.ObjectId(businessUrlId),
    source: source
  }).lean().exec();
};
export const getFilteredReviewsFromBatch = (
  reviewBatch: IReviewBatch | null,
  options: GetReviewsOptions = {}
): IReviewItem[] => {
  if (!reviewBatch || !reviewBatch.reviews || reviewBatch.reviews.length === 0) {
    return [];
  }
  let items = reviewBatch.reviews;
  if (options.minRating !== undefined) {
    items = items.filter(review => review.rating !== undefined && review.rating >= options.minRating!);
  }
  const offset = options.offset || 0;
  if (options.limit !== undefined) {
    items = items.slice(offset, offset + options.limit);
  } else if (offset > 0) {
    items = items.slice(offset);
  }
  return items;
};
interface UpsertReviewsArgs {
  businessUrlId: string;
  url: string;
  urlHash: string;
  source: 'google' | 'facebook';
  reviews: IReviewItem[]; 
}
export const upsertReviews = async (data: UpsertReviewsArgs): Promise<IReviewBatch> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(data.businessUrlId)) throw new Error("Invalid businessUrlId");

  return ReviewBatchModel.findOneAndUpdate(
    { businessUrlId: new Types.ObjectId(data.businessUrlId), source: data.source },
    {
      $set: {
        url: data.url,
        urlHash: data.urlHash,
        reviews: data.reviews,
        lastScrapedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();
};
export const getLatestReviews = async (userId: string, limit = 10): Promise<Array<IReviewItem & { businessName: string; source: 'google' | 'facebook'; businessUrl: string }>> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(userId)) return [];

  const userBusinessUrls = await BusinessUrlModel.find({ userId: new Types.ObjectId(userId) })
    .select('_id name url source')
    .lean()
    .exec();

  if (userBusinessUrls.length === 0) return [];

  const results: Array<IReviewItem & { businessName: string; source: 'google' | 'facebook'; businessUrl: string }> = [];

  for (const bizUrl of userBusinessUrls) {
    const reviewBatch = await ReviewBatchModel.findOne({
      businessUrlId: bizUrl._id,
      source: bizUrl.source,
    })
    .sort({ lastScrapedAt: -1 }) 
    .lean()
    .exec();

    if (reviewBatch && reviewBatch.reviews) {
      const reviewsFromBatch = reviewBatch.reviews.slice(0, limit).map(r => ({
        ...r,
        businessName: bizUrl.name,
        source: bizUrl.source,
        businessUrl: bizUrl.url,
      }));
      results.push(...reviewsFromBatch);
    }
  }
  results.sort((a, b) => {
      return 0; 
  });
  return results.slice(0, limit);
};
export const getWidgetById = async (id: string): Promise<IWidget | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return null;
  return WidgetModel.findById(id).populate('businessUrlId').lean().exec();
};

export const getWidgetsByUserId = async (userId: string): Promise<IWidget[]> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(userId)) return [];
  return WidgetModel.find({ userId: new Types.ObjectId(userId) })
    .populate({ path: 'businessUrlId', model: BusinessUrlModel }) 
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

interface CreateWidgetArgs {
  userId: string;
  businessUrlId: string;
  name: string;
  type?: string;
  maxReviews?: number;
  minRating?: number;
  settings?: Record<string, any>;
}
export const createWidget = async (widgetData: CreateWidgetArgs): Promise<IWidget> => {
  await ensureDbConnected();
  const newWidget = new WidgetModel({
    ...widgetData,
    userId: new Types.ObjectId(widgetData.userId),
    businessUrlId: new Types.ObjectId(widgetData.businessUrlId),
  });
  return newWidget.save();
};

interface UpdateWidgetArgs {
  name?: string;
  type?: string;
  maxReviews?: number;
  minRating?: number;
  businessUrlId?: string;
  settings?: Record<string, any>;
}
export const updateWidget = async (id: string, widgetData: UpdateWidgetArgs): Promise<IWidget | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return null;
  const updatePayload: UpdateQuery<IWidget> = { ...widgetData }; 
  updatePayload.updatedAt = new Date();
  if (widgetData.businessUrlId && Types.ObjectId.isValid(widgetData.businessUrlId)) {
    updatePayload.businessUrlId = new Types.ObjectId(widgetData.businessUrlId) as any; 
  } else if (widgetData.businessUrlId && !Types.ObjectId.isValid(widgetData.businessUrlId)) {
      delete updatePayload.businessUrlId;
      console.warn(`Invalid businessUrlId provided for widget update: ${widgetData.businessUrlId}`);
  }
  return WidgetModel.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).lean().exec();
};

export const incrementWidgetViews = async (id: string): Promise<IWidget | null> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return null;
  return WidgetModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).exec();
};

export const deleteWidget = async (id: string): Promise<{ acknowledged: boolean; deletedCount: number }> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(id)) return { acknowledged: false, deletedCount: 0 };
  return WidgetModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
};

export const getBusinessUrlStats = async (userId: string): Promise<IBusinessStats> => {
  await ensureDbConnected();
  if (!Types.ObjectId.isValid(userId)) {
    console.warn(`getBusinessUrlStats: Invalid userId provided: ${userId}`);
    // Return default empty stats if userId is invalid
    return {
      totalBusinessUrls: 0,
      totalWidgets: 0,
      totalReviews: 0,
      averageRating: 0,
      totalViews: 0,
      reviewsBySource: { google: 0, facebook: 0 },
    };
  }
  const userObjId = new Types.ObjectId(userId);
  const businessUrls = await BusinessUrlModel.find({ userId: userObjId }).lean().exec();
  const totalBusinessUrls = businessUrls.length;
  if (totalBusinessUrls === 0) {
    return {
      totalBusinessUrls: 0, totalWidgets: 0, totalReviews: 0,
      averageRating: 0, totalViews: 0, reviewsBySource: { google: 0, facebook: 0 },
    };
  }
  const businessUrlObjectIds = businessUrls.map(b => b._id);
  const reviewStats = await ReviewBatchModel.aggregate([
    { $match: { businessUrlId: { $in: businessUrlObjectIds } } },
    { $unwind: '$reviews' },
    {
      $group: {
        _id: '$source',
        totalReviewsInSource: { $sum: 1 },
        sumOfRatings: { $sum: { $ifNull: ['$reviews.rating', 0] } }, 
        countOfRatedReviews: { $sum: { $cond: [{ $isNumber: '$reviews.rating' }, 1, 0] } }, 
      },
    },
  ]).exec();
  let totalReviews = 0;
  let totalSumOfRatings = 0;
  let totalCountOfRatedReviews = 0;
  const reviewsBySource: { google: number; facebook: number } = { google: 0, facebook: 0 };
  reviewStats.forEach(stat => {
    totalReviews += stat.totalReviewsInSource;
    totalSumOfRatings += stat.sumOfRatings;
    totalCountOfRatedReviews += stat.countOfRatedReviews;
    if (stat._id === 'google') reviewsBySource.google = stat.totalReviewsInSource;
    if (stat._id === 'facebook') reviewsBySource.facebook = stat.totalReviewsInSource;
  });
  const averageRating = totalCountOfRatedReviews > 0 ? totalSumOfRatings / totalCountOfRatedReviews : 0;
  const totalWidgets = await WidgetModel.countDocuments({ userId: userObjId }).exec();
  const widgetViewsAgg = await WidgetModel.aggregate([
    { $match: { userId: userObjId } },
    { $group: { _id: null, totalViews: { $sum: '$views' } } },
  ]).exec();
  const totalViews = widgetViewsAgg.length > 0 && widgetViewsAgg[0].totalViews !== null ? widgetViewsAgg[0].totalViews : 0;
  return {
    totalBusinessUrls,
    totalWidgets,
    totalReviews,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalViews,
    reviewsBySource,
  };
};