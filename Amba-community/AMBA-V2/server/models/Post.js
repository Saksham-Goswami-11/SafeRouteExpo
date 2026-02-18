// server/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  locationLandmark: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  riskScore: { type: Number, default: 0 },
  aiTip: { type: String, default: '' }, // <-- YE NAYA FIELD HAI

  isFlaggedForHelp: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
export default Post;