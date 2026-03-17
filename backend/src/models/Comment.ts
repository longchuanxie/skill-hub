import { Schema, Document, model } from 'mongoose';

export interface IComment extends Document {
  content: string;
  user: Schema.Types.ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: Schema.Types.ObjectId;
  parentId?: Schema.Types.ObjectId;
  replies: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['skill', 'prompt'],
    required: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  }],
}, {
  timestamps: true,
});

commentSchema.index({ resourceType: 1, resourceId: 1 });
commentSchema.index({ parentId: 1 });

commentSchema.post('save', async function() {
  if (this.parentId) {
    await Comment.findByIdAndUpdate(this.parentId, {
      $push: { replies: this._id }
    });
  }
});

commentSchema.post('deleteOne', { document: true, query: false }, async function() {
  if (this.parentId) {
    await Comment.findByIdAndUpdate(this.parentId, {
      $pull: { replies: this._id }
    });
  }
  
  for (const replyId of this.replies) {
    await Comment.findByIdAndDelete(replyId);
  }
});

export const Comment = model<IComment>('Comment', commentSchema);
