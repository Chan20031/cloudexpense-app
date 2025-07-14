# 🚀 CloudExpense AWS Deployment Master Guide

## Deployment Architecture Overview

```
┌─────────────────┐    HTTPS     ┌─────────────────┐    PostgreSQL    ┌─────────────────┐
│   AWS Amplify   │ ────────────→│   AWS App Runner │ ───────────────→│    AWS RDS      │
│   (Frontend)    │              │    (Backend)     │                 │  (Database)     │
│                 │              │                  │                 │                 │
│ React + Vite    │              │ Node.js + Express│                 │   PostgreSQL    │
│ Tailwind CSS    │              │ JWT Auth         │                 │                 │
│ Auto HTTPS ✅   │              │ Auto HTTPS ✅    │                 │   Encrypted ✅  │
└─────────────────┘              └─────────────────┘                 └─────────────────┘
        │                                 │
        │                                 │
        ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│   CloudFront    │              │     AWS S3      │
│   (Global CDN)  │              │ (File Storage)  │
│                 │              │                 │
│ Fast Loading ⚡ │              │ Receipt Images  │
└─────────────────┘              └─────────────────┘
```

## 🎯 Deployment Order (IMPORTANT!)

### Phase 1: Backend Deployment
1. **Deploy to App Runner first** ✅
2. Get your App Runner URL
3. Test API endpoints

### Phase 2: Frontend Deployment  
1. **Update frontend environment** with App Runner URL
2. **Deploy to Amplify**
3. Get your Amplify URL

### Phase 3: Final Configuration
1. **Update backend CORS** with Amplify URL
2. **Test full application**
3. **Set up custom domains** (optional)

---

## 📋 Pre-Deployment Checklist

### ✅ Code Repository
- [x] Code pushed to GitHub
- [x] Environment template files created
- [x] Deployment configurations ready
- [x] Repository: `https://github.com/Chan20031/cloudexpense-app`

### ✅ AWS Resources
- [x] AWS Account with billing set up
- [x] RDS PostgreSQL database running
- [x] S3 bucket for file storage
- [x] IAM user with appropriate permissions

### ✅ Environment Variables Ready
**Backend (.env):**
```bash
# Database
DB_HOST=cloudexpense-db.cu18s8qo82la.us-east-1.rds.amazonaws.com
DB_USER=postgres
DB_PASSWORD=Zixue123!
DB_DATABASE=cloudexpense

# AWS Services  
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_S3_BUCKET=cloudexpense-receipts

# Email
EMAIL_USER=zixue4399@gmail.com
EMAIL_PASSWORD=yuco eqge wqak qydc
```

**Frontend (.env):**
```bash
VITE_API_URL=https://your-app-runner-url.com
VITE_GOOGLE_CLIENT_ID=892005808614-c1c2dtnns223luojkc2bol5s9tmc3jgo.apps.googleusercontent.com
```

---

## 🚀 Quick Start Deployment

### Step 1: Deploy Backend (15 minutes)
1. **Follow:** `APP_RUNNER_DEPLOYMENT_GUIDE.md`
2. **Result:** Get App Runner URL like `https://abc123.us-east-1.awsapprunner.com`
3. **Test:** Visit `https://your-url.com/health` should return `{"status":"healthy"}`

### Step 2: Deploy Frontend (10 minutes)  
1. **Update environment:** Use App Runner URL from Step 1
2. **Follow:** `AMPLIFY_DEPLOYMENT_GUIDE.md`
3. **Result:** Get Amplify URL like `https://main.d123.amplifyapp.com`

### Step 3: Connect Both Services (5 minutes)
1. **Update App Runner environment:**
   - `FRONTEND_URL = https://your-amplify-url.com`
   - Redeploy App Runner service
2. **Test full application:**
   - Registration, login, file upload, transactions

---

## 🌐 Expected Final URLs

After successful deployment:

- **Frontend (Amplify):** `https://main.d[random].amplifyapp.com`
- **Backend API (App Runner):** `https://[random].us-east-1.awsapprunner.com`
- **Database (RDS):** `cloudexpense-db.cu18s8qo82la.us-east-1.rds.amazonaws.com`
- **File Storage (S3):** `cloudexpense-receipts.s3.amazonaws.com`

---

## 💰 Cost Breakdown (Monthly)

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| **App Runner** | 0.25 vCPU, 0.5 GB | $7-12/month |
| **Amplify** | Hosting + builds | $1-5/month |
| **RDS (existing)** | db.t3.micro | $13-20/month |
| **S3 (existing)** | Storage + requests | $1-3/month |
| **Data Transfer** | Outbound traffic | $1-5/month |
| **Total** | | **$23-45/month** |

---

## 🔧 Post-Deployment Tasks

### 1. Custom Domains (Optional)
- **Frontend:** Add custom domain in Amplify Console
- **Backend:** Use CloudFront + ALB for custom API domain

### 2. Monitoring Setup
- **CloudWatch:** Enable detailed monitoring
- **Alerts:** Set up cost and performance alerts
- **Logs:** Configure log retention

### 3. Security Hardening
- **WAF:** Add Web Application Firewall
- **VPC:** Move App Runner to private VPC
- **Secrets Manager:** Store sensitive credentials

### 4. Performance Optimization
- **CDN:** Already included with Amplify
- **Database:** Enable read replicas if needed
- **Caching:** Implement Redis for sessions

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors:**
```javascript
// Frontend can't connect to backend
// Solution: Check FRONTEND_URL in App Runner environment
```

**2. Database Connection Failed:**
```bash
# Check RDS security groups
# Ensure App Runner can access RDS on port 5432
```

**3. Environment Variables Not Working:**
```bash
# Restart App Runner service after env var changes
# Check for typos in variable names
```

**4. Build Failures:**
```bash
# Check Amplify/App Runner build logs
# Verify all dependencies in package.json
```

### Getting Help
- **AWS Documentation:** [docs.aws.amazon.com](https://docs.aws.amazon.com)
- **AWS Support:** Available in AWS Console
- **Community:** Stack Overflow, AWS forums

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Frontend loads at Amplify URL
- ✅ User can register and receive email verification
- ✅ User can login and access dashboard
- ✅ Transactions can be created and viewed
- ✅ Receipt upload works and extracts text
- ✅ Budget management functions work
- ✅ All API endpoints respond correctly
- ✅ HTTPS works for both frontend and backend

**Happy Deploying! 🚀**
