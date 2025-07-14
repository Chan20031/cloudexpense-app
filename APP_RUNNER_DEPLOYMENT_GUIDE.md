# 🚀 AWS App Runner Deployment Guide (Backend)

## Overview
This guide will help you deploy your Node.js backend to AWS App Runner using the AWS Management Console.

## Prerequisites
- ✅ GitHub repository with your code
- ✅ AWS Account
- ✅ Dockerfile and apprunner.yaml (already created)
- ✅ AWS RDS PostgreSQL database (already set up)

## Step-by-Step Deployment

### 1. Access AWS App Runner Console
1. Go to [AWS Management Console](https://aws.amazon.com/console/)
2. Search for **"App Runner"** in the services search bar
3. Click **"App Runner"**

### 2. Create App Runner Service
1. Click **"Create service"**
2. **Source type:** Select **"Source code repository"**
3. Click **"Next"**

### 3. Connect Source Repository
1. **Connect to GitHub:**
   - Click **"Add new"** next to GitHub connection
   - Name: `cloudexpense-github-connection`
   - Click **"Connect to GitHub"**
   - Authorize AWS Connector for GitHub
   - Click **"Connect"**

2. **Repository settings:**
   - **Repository:** `Chan20031/cloudexpense-app`
   - **Branch:** `main`
   - **Source directory:** `/server` (important!)

3. **Deployment settings:**
   - **Deployment trigger:** ✅ Automatic
   - Click **"Next"**

### 4. Configure Build
1. **Configuration file:** Select **"Use a configuration file"**
   - File location: `apprunner.yaml`
   
2. **Or manually configure:**
   - **Runtime:** Node.js 18
   - **Build command:** `npm ci --only=production`
   - **Start command:** `npm start`
   - **Port:** `5000`

3. Click **"Next"**

### 5. Configure Service
1. **Service name:** `cloudexpense-backend`
2. **Virtual CPU:** `0.25 vCPU`
3. **Memory:** `0.5 GB`
4. **Environment variables:** Click **"Add environment variable"**

Add these environment variables:
```
NODE_ENV = production
PORT = 5000
TZ = Asia/Kuala_Lumpur
DB_USER = postgres
DB_PASSWORD = Zixue123!
DB_HOST = cloudexpense-db.cu18s8qo82la.us-east-1.rds.amazonaws.com
DB_PORT = 5432
DB_DATABASE = cloudexpense
JWT_SECRET = 7f4df5bc9bedfa7acbf4d3ca212abd31e8b70c2d7c125641d0a8d2e8af4ff326
EMAIL_SERVICE = gmail
EMAIL_USER = zixue4399@gmail.com
EMAIL_PASSWORD = yuco eqge wqak qydc
FRONTEND_URL = https://your-amplify-url.com
AWS_ACCESS_KEY_ID = your_aws_access_key_here
AWS_SECRET_ACCESS_KEY = your_aws_secret_key_here
AWS_REGION = us-east-1
AWS_S3_BUCKET = cloudexpense-receipts
```

### 6. Configure Security (Optional)
1. **Auto scaling:** 
   - Min instances: 1
   - Max instances: 3
2. **Health check:** 
   - Path: `/health`
   - Interval: 20 seconds
   - Timeout: 5 seconds
   - Healthy threshold: 1
   - Unhealthy threshold: 5

### 7. Review and Create
1. Review all settings
2. Click **"Create & deploy"**
3. Wait for deployment (usually 10-15 minutes)

### 8. Get Your API URL
1. Once deployment is complete, you'll get an App Runner URL like:
   `https://abcd1234.us-east-1.awsapprunner.com`
2. Your API is now live with HTTPS! 🎉

## Post-Deployment Configuration

### 1. Update Frontend Environment
1. Copy your App Runner URL
2. Go to Amplify Console
3. Update `VITE_API_URL` environment variable
4. Redeploy frontend

### 2. Update CORS Settings
1. Go to App Runner Console
2. Update `FRONTEND_URL` environment variable with your Amplify URL
3. Redeploy service

### 3. Test Your API
Test these endpoints:
```bash
# Health check
GET https://your-app-runner-url.com/health

# User registration
POST https://your-app-runner-url.com/api/auth/register
{
  "name": "Test User",
  "email": "test@example.com", 
  "password": "password123"
}
```

## Monitoring and Logs

### View Logs
1. App Runner Console → Your service
2. Click **"Logs"** tab
3. Select log stream to view detailed logs

### Metrics
1. **Service metrics:** CPU, Memory, Request count
2. **Custom metrics:** Available in CloudWatch

## Scaling and Performance

### Auto Scaling
- App Runner automatically scales based on traffic
- Configure min/max instances as needed
- Cold start time: ~2-3 seconds

### Performance Tips
1. **Keep warm:** Set minimum instances to 1
2. **Database connections:** Use connection pooling (already configured)
3. **File uploads:** Direct to S3 (already implemented)

## Security Best Practices

### Environment Variables
- ✅ All sensitive data in environment variables
- ✅ No secrets in code
- ✅ Database password encrypted

### Network Security
- ✅ HTTPS by default
- ✅ AWS VPC integration available
- ✅ Security groups for database access

## Cost Estimate
- **App Runner:** ~$7-15/month for 0.25 vCPU, 0.5 GB
- **Data transfer:** Included in service cost
- **Build time:** Minimal cost for builds

## Troubleshooting

### Deployment Failures
1. Check App Runner logs
2. Verify Dockerfile syntax
3. Ensure all dependencies in package.json

### Database Connection Issues
1. Check security groups
2. Verify RDS is publicly accessible
3. Test connection from local environment

### Environment Variable Issues
1. Double-check all variables are set
2. Restart service after updates
3. Check for typos in variable names
