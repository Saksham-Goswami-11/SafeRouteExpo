// server/controllers/postController.js
import Post from '../models/Post.js';
import axios from 'axios';

// --- 1. Get All Posts (Feed) ---
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).populate('author', 'username profilePicture');
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};
// --- 2. Create New Post (With AI Risk Analysis) ---
// server/controllers/postController.js -> createPost
export const createPost = async (req, res) => {
  const { title, text, locationLandmark, isFlaggedForHelp, isAnonymous } = req.body;
  
  try {
    // 1. AI Analysis
    let riskScore = 0.1; 
    let aiTip = "Stay safe and alert."; // Default tip

    try {
      const aiResponse = await axios.post('http://127.0.0.1:8000/analyze', { text });
      riskScore = aiResponse.data.risk_score;
      if (aiResponse.data.safety_tip) {
        aiTip = aiResponse.data.safety_tip; // Python se tip utha li
      }
    } catch (aiErr) {
      console.error("AI Server Offline, using defaults.");
    }

    let mediaUrl = '';
    let mediaType = 'none';

    if (req.file) {
      mediaUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const post = await Post.create({
      title,
      text,
      locationLandmark,
      author: req.user.id,
      riskScore,
      aiTip, // <-- Save kar rahe hain
      mediaUrl,
      mediaType,
      isFlaggedForHelp: isFlaggedForHelp === 'true',
      isAnonymous: isAnonymous === 'true'
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. Search Safety by Location (Landmark Search) ---
export const searchLocationSafety = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    const posts = await Post.find({
      locationLandmark: { $regex: query, $options: 'i' }
    });

    if (posts.length === 0) {
      return res.status(200).json({ message: 'No data for this location yet.', stats: null });
    }

    const totalRisk = posts.reduce((acc, post) => acc + (post.riskScore || 0), 0);
    const avgRisk = (totalRisk / posts.length) * 100;

    let safetyLevel = 'Safe';
    if (avgRisk > 70) safetyLevel = 'High Risk';
    else if (avgRisk > 40) safetyLevel = 'Moderate';

    res.status(200).json({
      location: query,
      stats: {
        totalIncidents: posts.length,
        averageRisk: avgRisk.toFixed(1),
        safetyLevel,
        flaggedHelpRequests: posts.filter(p => p.isFlaggedForHelp).length
      },
      relevantPosts: posts.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Search Error', error: error.message });
  }
};

// --- 4. Get Current User's Posts (Profile History) ---
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your posts', error: error.message });
  }
};

// --- 5. Get Post By ID (Detail View) ---
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username profilePicture');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};

// --- 6. Flag Post for Help (NGO Alert) ---
export const flagPostForHelp = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isFlaggedForHelp = true;
    await post.save();
    res.status(200).json({ message: 'Post flagged for help successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error flagging post', error: error.message });
  }
};

// --- 7. NGO Help Desk: Get Flagged Posts ---
export const getFlaggedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isFlaggedForHelp: true }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flagged posts', error: error.message });
  }
};

// --- 8. Create Comment ---
export const createPostComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = {
      text: req.body.text,
      author: req.user.id,
      username: req.user.username
    };

    post.comments.push(comment);
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// --- 9. Dashboard Stats ---
export const getDashboardStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const highRiskPosts = await Post.countDocuments({ riskScore: { $gt: 0.7 } });
    const helpRequests = await Post.countDocuments({ isFlaggedForHelp: true });

    res.status(200).json({ totalPosts, highRiskPosts, helpRequests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};
// server/controllers/postController.js

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
      post.dislikes = post.dislikes.filter(id => id.toString() !== req.user.id); // Remove dislike if liking
    }
    await post.save();
    res.json(post);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.dislikes.includes(req.user.id)) {
      post.dislikes = post.dislikes.filter(id => id.toString() !== req.user.id);
    } else {
      post.dislikes.push(req.user.id);
      post.likes = post.likes.filter(id => id.toString() !== req.user.id); // Remove like if disliking
    }
    await post.save();
    res.json(post);
  } catch (error) { res.status(500).json({ message: error.message }); }
};