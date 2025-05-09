import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWidget extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  businessUrlId: Types.ObjectId;
  name: string;
  type: string;
  maxReviews: number;
  minRating: number;
  settings: Record<string, unknown>; 
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema: Schema<IWidget> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  businessUrlId: { type: Schema.Types.ObjectId, ref: 'BusinessUrl', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['list', 'grid', 'carousel', 'badge', 'masonry'], default: 'list' },
  maxReviews: { type: Number, default: 10 },
  minRating: { type: Number, default: 1 },
  settings: { type: Schema.Types.Mixed, default: {} },
  views: { type: Number, default: 0 }
}, { timestamps: true });

const WidgetModel: Model<IWidget> = mongoose.models.Widget || mongoose.model<IWidget>('Widget', WidgetSchema, 'widgets');
export default WidgetModel;