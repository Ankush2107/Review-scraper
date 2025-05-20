import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReviewItem {
  reviewId?: string; 
  author: string;
  content: string;
  rating?: number;
  postedAt: string; 
  profilePicture?: string; 
  recommendationStatus?: string; 
  userProfile?: string; 
  scrapedAt?: Date; 
} 

const ReviewItemSchema: Schema<IReviewItem> = new Schema({
  reviewId: { type: String, index: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number },
  postedAt: { type: String, required: true }, 
  profilePicture: { type: String },
  recommendationStatus: { type: String },
  userProfile: { type: String },
  scrapedAt: { type: Date },
}, { _id: false }); 

export interface IReviewBatch extends Document {
  _id: Types.ObjectId;
  businessUrlId?: Types.ObjectId | null;
  urlHash: string; 
  url: string;
  source?: 'google' | 'facebook' | string; 
  reviews: IReviewItem[]; 
  lastScrapedAt?: Date;
  timestamp?: Date;
}

const ReviewBatchSchema: Schema<IReviewBatch> = new Schema({
  businessUrlId: { type: Schema.Types.ObjectId, ref: 'BusinessUrl', index: true, sparse: true },
  urlHash: { type: String, required: true, index: true },
  url: { type: String, required: true },
  source: { type: String, enum: ['google', 'facebook', undefined, null] },
  reviews: [ReviewItemSchema], 
  lastScrapedAt: { type: Date, default: Date.now },
  timestamp: { type: Date }
});

ReviewBatchSchema.index({ businessUrlId: 1, source: 1 }, { unique: true, sparse: true }); 

const GoogleReviewBatchModel: Model<IReviewBatch> =
  mongoose.models.GoogleReviewBatch ||
  mongoose.model<IReviewBatch>('GoogleReviewBatch', ReviewBatchSchema, 'business_reviews'); 

const FacebookReviewBatchModel: Model<IReviewBatch> =
  mongoose.models.FacebookReviewBatch ||
  mongoose.model<IReviewBatch>('FacebookReviewBatch', ReviewBatchSchema, 'facebook_reviews'); 

export { GoogleReviewBatchModel, FacebookReviewBatchModel };