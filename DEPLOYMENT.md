# Deployment Guide

This guide explains how to deploy ClassQuiz to production.

## Backend Deployment

### Option 1: Deploy to Render.com (Free tier available)

1. **Create a new Web Service** on [Render](https://render.com)
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
   - **Environment Variables:**
     - `PORT` - (Render sets this automatically)
     - `SECRET_KEY` - Generate a strong secret key
     - `NODE_ENV` - `production`

4. **Your backend will be available at:** `https://your-app-name.onrender.com`

### Option 2: Deploy to Railway.app

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set the **Root Directory** to `backend`
4. Add environment variables:
   - `SECRET_KEY` - Generate a strong secret key
   - `NODE_ENV` - `production`
5. Deploy!

### Option 3: Deploy to Heroku

```bash
# Install Heroku CLI
# Navigate to backend folder
cd backend

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key-here
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main
```

## Frontend Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Configure environment variables:**
   - Go to project settings on Vercel
   - Add environment variables:
     - `GEMINI_API_KEY` - Your Gemini API key
     - `VITE_API_URL` - Your deployed backend URL (e.g., `https://your-backend.onrender.com/api`)

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Drag and drop the `dist` folder to [Netlify](https://app.netlify.com)
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=dist
     ```

3. **Set environment variables** in Netlify dashboard:
   - `GEMINI_API_KEY`
   - `VITE_API_URL`

### Option 3: Deploy to GitHub Pages

1. **Update `vite.config.ts`:**
   ```typescript
   base: '/your-repo-name/'
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Use gh-pages package to deploy dist folder
   ```

## Environment Variables Summary

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
SECRET_KEY=your-super-secret-jwt-key-change-this
```

### Frontend (.env)
```env
GEMINI_API_KEY=your-gemini-api-key
VITE_API_URL=https://your-backend-url.com/api
```

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend can connect to backend API
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] Database is persisting data
- [ ] Gemini API is working
- [ ] Authentication is working
- [ ] Quiz creation is working

## Troubleshooting

### CORS Issues
If you get CORS errors, update the backend CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

### Database Issues
For production, consider using a managed database service:
- **PostgreSQL:** Render, Supabase, or Railway
- **MySQL:** PlanetScale or Railway

### API Key Issues
- Ensure Gemini API key is valid
- Check API quotas and limits
- Verify environment variables are loaded correctly

## Monitoring

Consider adding:
- Error tracking (e.g., Sentry)
- Analytics (e.g., Google Analytics)
- Uptime monitoring (e.g., UptimeRobot)
