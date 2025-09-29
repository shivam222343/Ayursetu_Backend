const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Fix path resolution for deployment
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  // Log current working directory for debugging
  console.log('Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);
  
  // Set working directory to the correct location
  process.chdir(__dirname);
  console.log('Changed working directory to:', process.cwd());
}

const dbConnect = require("./src/config/dbConnect");
const cors = require("cors");
const { startEmailScheduler } = require('./src/services/emailScheduler');
dotenv.config();
dbConnect();

const app = express();

// Enhanced CORS configuration with dynamic allowlist (supports Netlify domain)
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://ayursetuu.netlify.app'
];

// Allow configuring additional origins via env: ALLOWED_ORIGINS="https://foo.app,https://bar.com"
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowlist = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow server-to-server or Postman
    const isAllowed = allowlist.includes(origin);
    return callback(isAllowed ? null : new Error(`CORS: Origin ${origin} not allowed`), isAllowed);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
// Express 5 compatible global preflight handler (avoid path-to-regexp '*' issue)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    // If origin is allowed (or undefined for non-browser tools), reply with CORS headers
    if (!origin || allowlist.includes(origin)) {
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
      }
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      return res.sendStatus(204);
    }
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api", require("./src/routes/appointmentRoutes"));
app.use("/api", require("./src/routes/notificationRoutes"));
app.use("/api/feedback", require("./src/routes/feedbackRoutes"));
app.use("/api/medical-records", require("./src/routes/medicalRecordRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));
app.use("/api/prescriptions", require("./src/routes/prescriptionRoutes"));
app.use("/api/doctor", require("./src/routes/doctor/prescriptionRoutes"));
app.use("/api/availability", require("./src/routes/doctorAvailabilityRoutes"));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  
  // Start email scheduler
  startEmailScheduler();
});
