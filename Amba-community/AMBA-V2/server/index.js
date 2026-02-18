// server/index.js
import 'dotenv/config'; 
import express from 'express';
import path from 'path';
import cors from 'cors';
import connectDB from './config/db.js';

// 1. Load Environment Variables (Loaded at top) 

// 2. Connect to Database (Ab ye error nahi dega kyunki variables load ho chuke hain)
connectDB();

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

const app = express();

app.use(express.json());
app.use(cors());

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});