# 🚀 CloudExpense Local Deployment Guide with Your Credentials

## 🎯 DEPLOYMENT ORDER (CRITICAL!)

**❗ IMPORTANT: Deploy in this exact order:**

1. **BACKEND FIRST** (App Runner) - 15 minutes
2. **FRONTEND SECOND** (Amplify) - 10 minutes  
3. **CONNECT BOTH** - 5 minutes

---

## 📋 Phase 1: Deploy Backend to App Runner (START HERE!)

### 1. Access AWS App Runner Console
1. Go to [AWS Management Console](https://aws.amazon.com/console/)
2. Search for **"App Runner"** 
3. Click **"App Runner"**

### 2. Create App Runner Service
1. Click **"Create service"**
2. **Source type:** Select **"Source code repository"**
3. Click **"Next"**

### 3. Connect GitHub Repository
1. **Connect to GitHub:**
   - Click **"Add new"** next to GitHub connection
   - Name: `cloudexpense-github-connection`
   - Click **"Connect to GitHub"**
   - Authorize AWS Connector for GitHub
   - Click **"Connect"**

2. **Repository settings:**
   - **Repository:** `Chan20031/cloudexpense-app`
   - **Branch:** `main`
   - **Source directory:** `/server` ⚠️ **CRITICAL: Must be /server**

3. **Deployment settings:**
   - **Deployment trigger:** ✅ Automatic
   - Click **"Next"**

### 4. Configure Build (Use Configuration File)
1. **Configuration file:** Select **"Use a configuration file"**
   - File location: `apprunner.yaml`
2. Click **"Next"**

### 5. Configure Service Settings
1. **Service name:** `cloudexpense-backend`
2. **Virtual CPU:** `0.25 vCPU`
3. **Memory:** `0.5 GB`

### 6. ADD YOUR ENVIRONMENT VARIABLES (Copy these exactly):

Click **"Add environment variable"** for each:

```
NODE_ENV = production
PORT = 5000
TZ = Asia/Kuala_Lumpur
DB_USER = postgres
DB_PASSWORD = Zixue123!
DB_HOST = cloudexpense-db.cu18s8qo82la.us-east-1.rds.amazonaws.com
DB_PORT = 5432
DB_DATABASE = cloudexpense
JWT_SECRET = your_jwt_secret_here
EMAIL_SERVICE = gmail
EMAIL_USER = your_email@gmail.com
EMAIL_PASSWORD = your_gmail_app_password
FRONTEND_URL = http://localhost:5173
AWS_ACCESS_KEY_ID = your_aws_access_key_id
AWS_SECRET_ACCESS_KEY = your_aws_secret_access_key
AWS_REGION = us-east-1
AWS_S3_BUCKET = your_s3_bucket_name
```

### 7. Configure Security & Health Check
1. **Auto scaling:** 
   - Min instances: 1
   - Max instances: 3
2. **Health check:** 
   - Path: `/health`
   - Interval: 20 seconds

### 8. Create & Deploy
1. Click **"Create & deploy"**
2. ⏰ **Wait 10-15 minutes** for deployment
3. **COPY YOUR APP RUNNER URL** (looks like: `https://abc123.us-east-1.awsapprunner.com`)

### 9. Test Backend
Visit: `https://your-app-runner-url.com/health`
Should return: `{"status":"healthy","timestamp":"...","uptime":...}`

---

## 📋 Phase 2: Deploy Frontend to Amplify

### 1. Access AWS Amplify Console
1. Go to [AWS Management Console](https://aws.amazon.com/console/)
2. Search for **"Amplify"**
3. Click **"AWS Amplify"**

### 2. Create New App
1. Click **"Create new app"**
2. Select **"Host web app"**
3. Choose **"GitHub"** as your Git provider
4. Click **"Continue"**

### 3. Connect Repository
1. **Authorize GitHub** if needed
2. **Select Repository:** `Chan20031/cloudexpense-app`
3. **Select Branch:** `main`
4. Click **"Next"**

### 4. Configure Build Settings
1. **App name:** `cloudexpense-frontend`
2. **Environment name:** `production`
3. **Build and test settings:** Should auto-detect `amplify.yml`

### 5. ADD YOUR ENVIRONMENT VARIABLES:

Click **"Advanced settings"** → **"Add environment variable"**:

```
VITE_API_URL = https://YOUR-APP-RUNNER-URL-FROM-STEP-1.com
VITE_GOOGLE_CLIENT_ID = 892005808614-c1c2dtnns223luojkc2bol5s9tmc3jgo.apps.googleusercontent.com
```

⚠️ **Replace `YOUR-APP-RUNNER-URL-FROM-STEP-1` with actual URL from Phase 1**

### 6. Deploy
1. Click **"Next"** → **"Save and deploy"**
2. ⏰ **Wait 5-10 minutes**
3. **COPY YOUR AMPLIFY URL** (looks like: `https://main.d123456.amplifyapp.com`)

---

## 📋 Phase 3: Connect Both Services

### 1. Update Backend CORS
1. Go back to **App Runner Console**
2. Click your service → **Configuration** → **Environment variables**
3. **Edit** `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://your-amplify-url-from-phase-2.com
   ```
4. Click **"Deploy"** to restart service

### 2. Test Full Application
1. Visit your Amplify URL
2. Try these features:
   - ✅ Register new account
   - ✅ Check email for verification
   - ✅ Login with verified account
   - ✅ Add a transaction
   - ✅ Upload a receipt image
   - ✅ Create a budget

---

## 🎯 Your Final URLs (Fill in after deployment):

```
Frontend (Amplify): https://main.d____________.amplifyapp.com
Backend (App Runner): https://____________.us-east-1.awsapprunner.com
Database (RDS): cloudexpense-db.cu18s8qo82la.us-east-1.rds.amazonaws.com
Storage (S3): cloudexpense-receipts
```

---

## 🆘 Troubleshooting

### Backend Issues:
```bash
# Test health endpoint
curl https://your-app-runner-url.com/health

# Test user registration
curl -X POST https://your-app-runner-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'
```

### Frontend Issues:
1. **Build fails:** Check dependencies in Amplify build logs
2. **API not connecting:** Verify `VITE_API_URL` environment variable
3. **CORS errors:** Check `FRONTEND_URL` in App Runner

### Common Problems:
- **Database connection fails:** Check RDS security groups
- **S3 upload fails:** Verify AWS credentials and bucket permissions
- **Email not sending:** Check Gmail app password

---

## 💰 Expected Monthly Cost:
- App Runner: $7-12/month
- Amplify: $1-5/month
- **Total new cost: ~$8-17/month** (RDS and S3 already running)

---

## ✅ Success Checklist:

After deployment, you should be able to:
- [ ] Access frontend at Amplify URL
- [ ] Register and receive verification email
- [ ] Login successfully
- [ ] Add transactions
- [ ] Upload receipts with OCR
- [ ] Create and manage budgets
- [ ] View dashboard analytics

**🎉 Happy Deploying! Start with Phase 1 (App Runner Backend) now!**
