# Vercel Deployment Guide

This guide explains how to deploy the backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. All environment variables configured

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Navigate to Backend Directory
```bash
cd backend
```

### 4. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (for first deployment)
- What's your project's name? **backend** (or your preferred name)
- In which directory is your code located? **./** (current directory)

### 5. Set Environment Variables

After deployment, set all required environment variables in Vercel:

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=your-jwt-secret
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
NODE_ENV=production
```

### 6. Redeploy After Setting Environment Variables

After adding environment variables, redeploy:
```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

## Production Deployment

For production deployment:
```bash
vercel --prod
```

## Important Notes

### Database Connection
- The backend uses MongoDB Atlas (cloud database)
- Make sure your MongoDB Atlas IP whitelist includes Vercel's IP ranges
- Or set IP whitelist to `0.0.0.0/0` for all IPs (less secure, but works for testing)

### CORS Configuration
- Update `FRONTEND_URL` in environment variables to your production frontend URL
- The backend CORS is configured to allow requests from `FRONTEND_URL`

### Stripe Webhooks
- After deployment, update your Stripe webhook endpoint to:
  `https://your-backend-domain.vercel.app/api/payments/webhook`
- Make sure to use the production webhook secret in environment variables

### File Uploads
- Cloudinary is used for file uploads
- Make sure all Cloudinary credentials are set in environment variables

## Testing Deployment

After deployment, test the health endpoint:
```bash
curl https://your-backend-domain.vercel.app/health
```

You should receive:
```json
{"status":"ok","message":"Server is running"}
```

## Troubleshooting

### Connection Issues
- Check MongoDB Atlas IP whitelist
- Verify `MONGODB_URI` is correct
- Check Vercel function logs in the dashboard

### Environment Variables
- Make sure all required variables are set
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Build Errors
- Check TypeScript compilation errors
- Verify all dependencies are in `package.json`
- Check Vercel build logs

## Project Structure for Vercel

```
backend/
├── api/
│   └── index.ts          # Vercel serverless entry point
├── src/
│   └── index.ts          # Express app (exported for Vercel)
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## API Endpoints

All API endpoints will be available at:
```
https://your-backend-domain.vercel.app/api/*
```

For example:
- `https://your-backend-domain.vercel.app/api/auth/login`
- `https://your-backend-domain.vercel.app/api/projects`
- `https://your-backend-domain.vercel.app/api/payments/webhook`


