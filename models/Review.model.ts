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
  businessUrlId: Types.ObjectId; 
  urlHash: string; 
  url: string; 
  source: 'google' | 'facebook';
  reviews: IReviewItem[];
  lastScrapedAt: Date; 
}

const ReviewBatchSchema: Schema<IReviewBatch> = new Schema({
  businessUrlId: { type: Schema.Types.ObjectId, ref: 'BusinessUrl', required: true, index: true },
  urlHash: { type: String, required: true, index: true },
  url: { type: String, required: true },
  source: { type: String, required: true, enum: ['google', 'facebook'] },
  reviews: [ReviewItemSchema],
  lastScrapedAt: { type: Date, default: Date.now },
});
ReviewBatchSchema.index({ businessUrlId: 1, source: 1 }, { unique: true });
const ReviewBatchModel: Model<IReviewBatch> = mongoose.models.ReviewBatch || mongoose.model<IReviewBatch>('ReviewBatch', ReviewBatchSchema, 'review_batches');
export default ReviewBatchModel;