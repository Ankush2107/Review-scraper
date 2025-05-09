import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBusinessUrl extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; 
  name: string;
  url: string;
  urlHash: string;
  source: 'google' | 'facebook';
  addedAt: Date;
  lastScrapedAt?: Date;
}

const BusinessUrlSchema: Schema<IBusinessUrl> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  urlHash: { type: String, required: true, unique: true, index: true },
  source: { type: String, required: true, enum: ['google', 'facebook'] },
  addedAt: { type: Date, default: Date.now },
  lastScrapedAt: { type: Date },
}, { timestamps: { createdAt: 'addedAt', updatedAt: true } } );

const BusinessUrlModel: Model<IBusinessUrl> = mongoose.models.BusinessUrl || mongoose.model<IBusinessUrl>('BusinessUrl', BusinessUrlSchema, 'business_urls');
export default BusinessUrlModel;