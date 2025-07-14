# Production Deployment Setup

## Frontend Environment Variables for AWS Amplify

The frontend environment variables are automatically configured in the `amplify.yml` file:
- `VITE_API_URL`: https://8ftpmep4qh.us-east-1.awsapprunner.com  
- `VITE_GOOGLE_CLIENT_ID`: 892005808614-c1c2dtnns223luojkc2bol5s9tmc3jgo.apps.googleusercontent.com

## Backend Environment Variables for AWS App Runner

When deploying to AWS App Runner, make sure to set the following environment variable in the App Runner console:

### Required Environment Variable

1. Go to your AWS App Runner service console
2. Navigate to Configuration > Environment variables  
3. Set the following variable:

```
SENDGRID_API_KEY = YOUR_ACTUAL_SENDGRID_API_KEY
```

### Other Environment Variables

All other environment variables are already configured in the `apprunner.yaml` file except for:
- `SENDGRID_API_KEY` - This must be set manually in the App Runner console for security

## Frontend-Backend Connection Fix

**IMPORTANT**: The issue where uploads were connecting to localhost instead of production has been fixed by:

1. **amplify.yml**: Environment variables are now set in the Amplify build configuration
2. **.env.production**: Production environment file created as backup
3. **All API calls**: Properly configured to use production URLs when deployed

Your friends will now be able to use all features including:
- User registration and email verification
- Password reset functionality  
- File uploads and image handling
- All transaction and income features

### SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Verify your sender email address
3. Generate an API key with "Mail Send" permissions
4. Use this API key in the App Runner environment variable

### Security Notes

- Never commit actual API keys to GitHub
- The `.env` files are gitignored for security
- Production API keys should only be set in the App Runner console
- All sensitive credentials are properly excluded from version control

### Testing

1. **Local Testing**: Use localhost:5000 with your local .env file
2. **Production Testing**: The app automatically uses the production URLs when deployed

### URLs

- **Frontend (Amplify)**: https://main.d1woe51v3gv9g2.amplifyapp.com
- **Backend (App Runner)**: https://8ftpmep4qh.us-east-1.awsapprunner.com

### Deployment Process

1. Push code to GitHub (no credentials included)
2. AWS App Runner automatically builds and deploys
3. Set the SENDGRID_API_KEY in App Runner console
4. Email functionality will work in production
