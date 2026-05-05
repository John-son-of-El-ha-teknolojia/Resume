import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
// Removed GoogleGenerativeAI as AI is now handled by external Python backend

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

const angularApp = new AngularNodeAppEngine();

// Simple in-memory storage for tracking free downloads, subscriptions, and users
const downloadTracker = new Set<string>(); // "email:ip" keys
const activeSubscriptions = new Map<string, { tier: string; expires: number; amount: number }>();
const users = new Map<string, { email: string; lastActive: number }>();

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  // In a real app, you would verify against a DB.
  
  users.set(email, { email, lastActive: Date.now() });
  
  return res.json({ 
    success: true, 
    email,
    isAdmin: email === 'curtisombai@gmail.com'
  });
});

// Admin Stats Endpoint
app.get('/api/admin/stats', (req, res) => {
  const totalUsers = users.size;
  const activeUsersThreshold = Date.now() - (15 * 60 * 1000); // Active in last 15 mins
  const activeUsers = Array.from(users.values()).filter(u => u.lastActive > activeUsersThreshold).length;
  
  let totalRevenue = 0;
  const tierCounts: Record<string, number> = { '3days': 0, '1month': 0, '1year': 0 };
  
  activeSubscriptions.forEach(sub => {
    totalRevenue += sub.amount;
    if (tierCounts[sub.tier] !== undefined) {
      tierCounts[sub.tier]++;
    }
  });

  return res.json({
    totalUsers,
    activeUsers,
    totalRevenue,
    tierCounts
  });
});

// AI endpoints are now handled by external Python backend at http://localhost:8080

// Resume Extraction (Simulated)
app.post('/api/resume/extract', async (req, res) => {
  const { fileName } = req.body; // In a real app, you'd handle file upload
  console.log(`Extracting from: ${fileName}`);
  
  // Simulated delay for "AI Parsing"
  setTimeout(() => {
    res.json({
      name: 'Jonathan Doe',
      email: 'jonathan.doe@example.com',
      phone: '+254 700 123 456',
      location: 'Nairobi, Kenya',
      summary: 'Experienced Software Engineer with a focus on cloud-native solutions and AI integration.',
      sections: [
        { id: 'exp1', title: 'Work Experience', content: 'Lead Developer at Tech Hub (2020-Present)\n- Optimized system performance by 30%.' },
        { id: 'edu1', title: 'Education', content: 'B.Sc. in Computer Science - University of Nairobi' }
      ]
    });
  }, 2000);
});

// Check Download Eligibility
app.post('/api/resume/check-eligibility', (req, res) => {
  const { email } = req.body;
  const ip = req.ip || 'unknown';
  const key = `${email}:${ip}`;
  
  const sub = activeSubscriptions.get(email);
  const isPremium = sub && sub.expires > Date.now();
  const hasFreeDownloadLeft = !downloadTracker.has(key);
  
  res.json({
    canDownload: isPremium || hasFreeDownloadLeft,
    isPremium,
    hasFreeDownloadLeft
  });
});

// Payment Initiation
app.post('/api/payment/initiate', (req, res) => {
  const { amount, phone, email, tier } = req.body;
  console.log(`Initiating payment of ${amount} KES for ${email} from ${phone} (Tier: ${tier})`);
  
  // Simulate success after a short delay
  setTimeout(() => {
    // Record subscription
    let duration = 0;
    if (tier === '3days') duration = 3 * 24 * 60 * 60 * 1000;
    else if (tier === '1month') duration = 30 * 24 * 60 * 60 * 1000;
    else if (tier === '1year') duration = 365 * 24 * 60 * 60 * 1000;
    
    if (duration > 0) {
      activeSubscriptions.set(email, { tier, expires: Date.now() + duration, amount: Number(amount) });
    }

    res.json({ 
      success: true, 
      message: 'Payment successful.',
      transactionId: 'MP' + Math.random().toString(36).substring(7).toUpperCase()
    });
  }, 1500);
});

// PDF Generation endpoint (Simulated)
app.get('/api/resume/pdf', (req, res) => {
  const email = req.query['email'] as string;
  const ip = req.ip || 'unknown';
  const key = `${email}:${ip}`;

  // Log "Free Download" if not premium and hasn't used free one
  const sub = activeSubscriptions.get(email);
  const isPremium = sub && sub.expires > Date.now();
  
  if (!isPremium) {
    downloadTracker.add(key);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
  res.send(Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (My Resume) >>\nendobj\n%%EOF'));
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
