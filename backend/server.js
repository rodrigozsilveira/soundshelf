const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// minio private client 
const minioInternalClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',  
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// minio public client for signed URLs
const minioPublicClient = new Minio.Client({
  endPoint: process.env.MINIO_PUBLIC_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PUBLIC_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/musicapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// music schema
const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Music = mongoose.model('Music', musicSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.log('JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// initialize minio bucket
const initializeBucket = async () => {
  try {
    const bucketExists = await minioInternalClient.bucketExists('music');
    if (!bucketExists) {
      await minioInternalClient.makeBucket('music', 'us-east-1');
      console.log('Bucket "music" created successfully');
    } else {
      console.log('Bucket "music" already exists');
    }
  } catch (error) {
    console.error('Error initializing MinIO:', error.message);
  }
};

// health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// upload music - private client
app.post('/api/upload', authenticateToken, upload.single('music'), async (req, res) => {
  try {
    const { title, artist } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // clear special characters for filename
    const cleanOriginalName = req.file.originalname
      .normalize('NFD')                   
      .replace(/[\u0300-\u036f]/g, "")    
      .replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${cleanOriginalName}`;

    console.log('⬆Uploading to MinIO:', filename);

    await minioInternalClient.putObject(
      'music', 
      filename, 
      req.file.buffer, 
      req.file.size,
      {
        'Content-Type': req.file.mimetype,
        'original-name': req.file.originalname
      }
    );

    console.log('File uploaded to MinIO');

    const music = new Music({
      title,
      artist,
      filename: filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.userId
    });

    await music.save();

    console.log('Music saved to database:', title);

    res.status(201).json({
      message: 'Music uploaded successfully',
      music: {
        id: music._id,
        title: music.title,
        artist: music.artist,
        filename: music.filename,
        originalName: music.originalName,
        size: music.size,
        uploadedAt: music.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading music', error: error.message });
  }
});

// get all music
app.get('/api/music', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching all music');
    
    const music = await Music.find()
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });

    console.log(`Found ${music.length} music files`);
    
    res.json(music);
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({ message: 'Error fetching music', error: error.message });
  }
});

// get music stream URL - public client for signed urls
app.get('/api/music/:id/stream', authenticateToken, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    console.log('Generating signed URL for:', music.title);

    const presignedUrl = await minioPublicClient.presignedGetObject(
      'music', 
      music.filename, 
      60 * 60 // 1 hour
    );

    console.log('Public signed URL:', presignedUrl);
    
    res.json({ 
      url: presignedUrl,
      title: music.title,
      artist: music.artist
    });
  } catch (error) {
    console.error('Error generating stream URL:', error);
    res.status(500).json({ message: 'Error generating stream URL', error: error.message });
  }
});

// get user uploaded music
app.get('/api/my-music', authenticateToken, async (req, res) => {
  try {
    const music = await Music.find({ uploadedBy: req.user.userId })
      .sort({ createdAt: -1 });

    res.json(music);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your music', error: error.message });
  }
});

// delete music - private client
app.delete('/api/music/:id', authenticateToken, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    
    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    if (music.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this music' });
    }

    await minioInternalClient.removeObject('music', music.filename);
    await Music.findByIdAndDelete(req.params.id);

    res.json({ message: 'Music deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting music', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`MinIO Internal: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
  console.log(`MinIO Public: ${process.env.MINIO_PUBLIC_ENDPOINT}:${process.env.MINIO_PUBLIC_PORT}`);
  
  setTimeout(async () => {
    await initializeBucket();
  }, 5000);
});