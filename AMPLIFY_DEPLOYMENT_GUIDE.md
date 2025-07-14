# 🚀 AWS Amplify Deployment Guide (Frontend)

## Overview
This guide will help you deploy your React frontend to AWS Amplify using the AWS Management Console.

## Prerequisites
- ✅ GitHub repository with your code
- ✅ AWS Account
- ✅ amplify.yml configuration file (already created)

## Step-by-Step Deployment

### 1. Access AWS Amplify Console
1. Go to [AWS Management Console](https://aws.amazon.com/console/)
2. Search for **"Amplify"** in the services search bar
3. Click **"AWS Amplify"**

### 2. Create New App
1. Click **"Create new app"**
2. Select **"Host web app"**
3. Choose **"GitHub"** as your Git provider
4. Click **"Continue"**

### 3. Connect Repository
1. **Authorize GitHub** - Click "Authorize AWS Amplify"
2. **Select Repository:** `Chan20031/cloudexpense-app`
3. **Select Branch:** `main`
4. Click **"Next"**

### 4. Configure Build Settings
1. **App name:** `cloudexpense-frontend`
2. **Environment name:** `production`
3. **Build and test settings:** 
   - The system should automatically detect your `amplify.yml` file
   - If not, paste this configuration:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. **Advanced settings** (Click to expand):
   - Add environment variables:
     ```
     VITE_API_URL = https://your-app-runner-url.com
     VITE_GOOGLE_CLIENT_ID = 892005808614-c1c2dtnns223luojkc2bol5s9tmc3jgo.apps.googleusercontent.com
     ```
   - Note: We'll update the API URL after deploying the backend

5. Click **"Next"**

### 5. Review and Deploy
1. Review all settings
2. Click **"Save and deploy"**
3. Wait for deployment (usually 5-10 minutes)

### 6. Access Your Deployed App
1. Once deployment is complete, you'll get an Amplify URL like:
   `https://main.d1234567890.amplifyapp.com`
2. Your React app is now live with HTTPS! 🎉

## Important Notes

### After Backend Deployment
1. Go back to Amplify Console
2. Click on your app → **Environment variables**
3. Update `VITE_API_URL` with your App Runner URL
4. **Redeploy** the app

### Custom Domain (Optional)
1. In Amplify Console → **Domain management**
2. Add your custom domain
3. Amplify will handle SSL certificates automatically

### Automatic Deployments
- Every push to `main` branch will trigger automatic deployment
- Monitor deployments in the Amplify Console

## Troubleshooting

### Build Failures
- Check build logs in Amplify Console
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### CORS Errors
- Make sure backend CORS is configured for your Amplify domain
- Update `FRONTEND_URL` in backend environment variables

## Cost Estimate
- **Amplify Hosting:** ~$1-5/month for small apps
- **Build minutes:** First 100 minutes/month are free
- **Data transfer:** First 15GB/month are free
