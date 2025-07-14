# 💰 CloudExpense - Smart Expense Tracking App

A full-stack expense tracking application with AI-powered receipt scanning, budget management, and real-time analytics.

## 🚀 Features

- 📱 **Modern UI** - Clean, responsive design with dark/light themes
- 🔐 **Secure Authentication** - JWT-based auth with email verification
- 📊 **Smart Analytics** - Visual charts and spending insights
- 🤖 **AI Receipt Scanning** - OCR-powered expense extraction from receipts
- 💰 **Budget Management** - Set and track category-based budgets
- 📈 **Income Tracking** - Monitor multiple income sources
- ☁️ **Cloud Storage** - Secure receipt storage with AWS S3
- 📧 **Email Notifications** - Account verification and alerts

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Interactive data visualization
- **React Router** - Client-side routing

### Backend
- **Node.js + Express** - RESTful API server
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication tokens
- **AWS SDK** - S3 storage and Textract OCR
- **bcrypt** - Password hashing
- **nodemailer** - Email services

### Cloud Infrastructure
- **AWS RDS** - Managed PostgreSQL database
- **AWS S3** - File storage for receipts
- **AWS Textract** - OCR text extraction
- **Ready for AWS Amplify + App Runner deployment**

## 📦 Project Structure

```
CloudExpense_Fixed/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   └── services/          # API service functions
├── server/                # Node.js backend
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   └── uploads/           # Temporary file uploads
├── public/                # Static assets
└── package.json           # Frontend dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or AWS RDS)
- AWS account (for S3 and Textract)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd CloudExpense_Fixed

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup
```bash
# Frontend environment
cp .env.example .env
# Edit .env with your API URL

# Backend environment
cp server/.env.example server/.env
# Edit server/.env with your database and AWS credentials
```

### 3. Database Setup
```sql
-- Create PostgreSQL database and tables
-- (SQL schema will be provided separately)
```

### 4. Run Development Servers
```bash
# Terminal 1: Start backend (from project root)
cd server
npm start

# Terminal 2: Start frontend (from project root)
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 🌐 Deployment

This app is designed for AWS deployment:

- **Frontend**: AWS Amplify (React SPA with CDN)
- **Backend**: AWS App Runner (containerized Node.js API)
- **Database**: AWS RDS PostgreSQL
- **Storage**: AWS S3 for receipt images

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email` - Email verification

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### File Upload & OCR
- `POST /api/upload` - Upload receipt to S3
- `POST /api/predict` - Extract text from receipt using AWS Textract

### Budget Management
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure file upload to S3
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ for modern expense management
