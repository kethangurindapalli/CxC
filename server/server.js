import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import matchRoutes from './routes/matches.js';
import connectionRoutes from './routes/connections.js';
import messageRoutes from './routes/messages.js';
import { initializeSocket } from './socket/socketHandler.js';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true
  }
});

initializeSocket(io);

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production if needed
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    // Use in-memory MongoDB if no URI or local fails (for college demo without Atlas)
    if (!mongoUri || mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
      try {
        if (mongoUri) {
          await mongoose.connect(mongoUri);
          console.log('Connected to MongoDB (local/Atlas)');
        } else {
          throw new Error('No URI');
        }
      } catch (e) {
        console.log('Local MongoDB not available, starting in-memory MongoDB...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
        console.log('Connected to in-memory MongoDB (data resets on restart)');
      }
    } else {
      try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas');
      } catch (e) {
        console.warn('Atlas connection failed (likely college WiFi blocking DNS SRV). Falling back to in-memory DB for demo...');
        console.warn('To use Atlas permanently, connect to mobile hotspot and restart.');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
        console.log('Connected to in-memory MongoDB (data resets on restart)');
      }
    }
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
