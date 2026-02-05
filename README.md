# Backend API - Client Project Portal (MongoDB)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables:
- `MONGODB_URI`: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/client-project-portal`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/client-project-portal`
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `FRONTEND_URL`: Frontend URL (default: http://localhost:5173)

4. Start MongoDB:
   - Local: Make sure MongoDB is running on your machine
   - Atlas: Use your connection string

5. Seed initial data (optional):
```bash
npm run seed
```

6. Run the server:
```bash
npm run dev
```

## Database Schema

### Collections

- **projects**: Project information
- **services**: Available services
- **projectbriefings**: Project briefing details
- **briefingimages**: Briefing reference images

## API Endpoints

### Projects
- `GET /api/projects/:projectId` - Get project by ID
- `GET /api/projects/:projectId/details` - Get project with full details
- `POST /api/projects/:projectId/service` - Update service selection

### Services
- `GET /api/services` - Get all active services
- `GET /api/services/:serviceId` - Get service by ID

### Payments
- `POST /api/payments/:projectId/checkout` - Create Stripe checkout session
- `POST /api/payments/webhook` - Stripe webhook handler

### Briefings
- `GET /api/briefings/:projectId` - Get briefing for project
- `POST /api/briefings/:projectId/submit` - Submit briefing

### Upload
- `POST /api/upload/:projectId/image` - Upload image (multipart/form-data)

## MVC Structure

- **Models**: Mongoose schemas (`src/models/`)
- **Views**: Response formatters (`src/views/`)
- **Controllers**: Business logic handlers (`src/controllers/`)
- **Routes**: API route definitions (`src/routes/`)
- **Middleware**: Validation and error handling (`src/middleware/`)
- **Config**: Database and service configurations (`src/config/`)

## Image Storage

Images are stored using **Cloudinary** cloud storage service.

### Cloudinary Setup

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. Add them to your `.env` file

### Features

- Automatic image optimization
- Responsive image delivery
- Secure URLs
- Automatic format conversion (WebP, AVIF when supported)
- Images organized by project ID in folders

### Upload Endpoint

- `POST /api/upload/:projectId/image` - Upload image (multipart/form-data)
  - Returns: `{ url, public_id, width, height }`
  - Images are stored in folder: `client-project-portal/{projectId}/`

### Delete Endpoint (Optional)

- `DELETE /api/upload/image/:publicId` - Delete image from Cloudinary
