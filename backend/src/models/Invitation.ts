import { Schema, Document, model } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  enterpriseId: Schema.Types.ObjectId;
  invitedBy: Schema.Types.ObjectId;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  enterpriseId: {
    type: Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: true,
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    required: true,
    default: 'member',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

invitationSchema.index({ email: 1, enterpriseId: 1 });
invitationSchema.index({ enterpriseId: 1, status: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 });

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
