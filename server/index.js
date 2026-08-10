const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const vendorRoutes = require('./routes/vendors');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const proposalRoutes = require('./routes/proposals');
const quotationRoutes = require('./routes/quotations');
const invoiceRoutes = require('./routes/invoices');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const projectCompletionReportRoutes = require('./routes/projectCompletionReports');
const budgetRoutes = require('./routes/budgets');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const deliveryNoteRoutes = require('./routes/deliveryNotes');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5178',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://192.168.1.14:5173',
  'http://192.168.1.14:3001',
  'http://work.smartuniit.com',
  'https://work.smartuniit.com',
  'https://www.work.smartuniit.com',
  'http://www.work.smartuniit.com',
  'http://test.smartuniit.com',
  'https://test.smartuniit.com',
  'https://www.test.smartuniit.com',
  'http://www.test.smartuniit.com'
];

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.split(',')[0].trim() : origin;
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static(path.join(__dirname, '../public')));

// Body parser error handling
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Proposal payload exceeds limit. Please reduce embedded logo/image size and retry.'
    });
  }
  return next(err);
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/project-completion-reports', projectCompletionReportRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend only for non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Serve frontend for all other routes
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = app; 
