# 💳 Emotion Detection Micro-Finance App

> AI-powered micro-finance mobile application with facial recognition and emotion detection for secure, fraud-proof transactions.

[![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python)](https://python.org)
[![React Native](https://img.shields.io/badge/React%20Native-Latest-blue?logo=react)](https://reactnative.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-blue?logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-Educational-green)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [Author](#author)

---

## 🎯 Overview

This project is a **secure micro-finance mobile application** that leverages cutting-edge AI technology to prevent fraudulent and coerced transactions. Using facial recognition and emotion detection algorithms, the app ensures that transactions are made willingly by authenticated users.

**Key Innovation:** Emotion detection blocks transactions if the user appears distressed, preventing coerced payments.

---

## ✨ Key Features

### ✅ Phase 1: Authentication System (Complete)

| Feature | Status | Details |
|---------|--------|---------|
| **User Registration** | ✅ | Full validation with age check (18+) |
| **Secure Login** | ✅ | JWT-based token authentication |
| **Face Capture** | ✅ | Camera integration for face images |
| **CNIC Validation** | ✅ | Prevents duplicate accounts |
| **Password Security** | ✅ | Bcrypt hashing with strength validation |

### 🔄 Phase 2: Core Banking (In Progress)

- 💰 Balance management & account overview
- 💸 Money transfer between users
- 📋 Transaction history & analytics
- 🔔 Transaction notifications

### 🚀 Phase 3: AI Security (Planned)

- 🧠 Emotion detection for transaction validation
- 👤 Facial recognition for user verification
- 🎭 Gesture-based liveness detection
- 🛡️ Fraud prevention algorithms

---

## 🛠️ Tech Stack

### Backend
```
FastAPI          → Modern async Python framework
SQLAlchemy       → ORM for database operations
PostgreSQL/SQLite → Relational database
JWT              → Secure token-based auth
Bcrypt           → Password hashing
ChromaDB         → Vector embeddings for face recognition
TensorFlow/PyTorch → AI/ML models
```

### Frontend
```
React Native     → Cross-platform mobile development
React Navigation → Navigation & routing
Vision Camera    → Camera integration
Axios            → HTTP client for API calls
Linear Gradient  → Beautiful UI components
```

### AI/ML
```
MediaPipe Face Landmarker  → Face detection & tracking
OpenFace                   → Face embeddings
Emotion Recognition Models → Emotion classification
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Backend
- Python 3.8 or higher
- pip/pipenv for package management

# Frontend
- Node.js 18+ and npm/yarn
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
```

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Set environment variables
cp .env.example .env
# Edit .env with your configuration

# 6. Run the server
uvicorn main:app --reload --port 8005
```

**API will be available at:** `http://localhost:8005`  
**Swagger Docs:** `http://localhost:8005/docs`

### Frontend Setup

```bash
# 1. Navigate to mobile
cd mobile

# 2. Install dependencies
npm install

# 3. Update API endpoint in src/services/api.js
# Choose based on your environment:
# - Android Emulator:  http://10.0.2.2:8005
# - iOS Simulator:     http://localhost:8005
# - Physical Device:   <your-machine-ip>:8005

# 4. Run the app
# Android:
npm run android

# iOS (macOS only):
npm run ios
```

---

## 📁 Project Structure

```
Emotion-Detection/
├── backend/                    # FastAPI server
│   ├── main.py                # Entry point
│   ├── auth.py                # Authentication logic
│   ├── models.py              # Database models
│   ├── schemas.py             # Request/response schemas
│   ├── database.py            # Database configuration
│   ├── services/
│   │   ├── ai_service.py      # Face recognition & embeddings
│   │   └── gesture_service.py # Liveness detection
│   ├── requirements.txt        # Python dependencies
│   └── .env.example           # Environment template
│
├── mobile/                     # React Native app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── services/          # API services
│   │   ├── utils/             # Helper functions
│   │   └── App.js             # Main app component
│   ├── android/               # Android-specific code
│   ├── ios/                   # iOS-specific code
│   ├── package.json           # Node dependencies
│   └── app.json               # Expo configuration
│
├── docs/                      # Documentation
├── README.md                  # This file
└── .gitignore                 # Git ignore rules
```

---

## 📡 API Endpoints

### Authentication

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Ammad Ajaz",
  "father_name": "Muhammad Ajaz",
  "date_of_birth": "1990-01-01",
  "email": "ammad@example.com",
  "cnic": "1234567890123",
  "username": "ammad_ajaz",
  "password": "SecurePass123!",
  "face_image": "base64_encoded_image"
}

Response: 201 Created
{
  "id": 1,
  "username": "ammad_ajaz",
  "email": "ammad@example.com",
  "message": "User registered successfully"
}
```

#### Log In
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "ammad_ajaz",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 1,
  "username": "ammad_ajaz",
  "email": "ammad@example.com",
  "balance": 0.0,
  "created_at": "2024-05-10T10:30:00Z"
}
```

**Complete API documentation available at:** `/docs` (Swagger UI) or `/redoc` (ReDoc)

---

## 🔐 Security

### Current Implementation
- ✅ **Password Hashing** - Bcrypt with salt for secure storage
- ✅ **JWT Authentication** - Token-based secure API access
- ✅ **Input Validation** - Comprehensive client & server-side validation
- ✅ **CNIC Uniqueness** - One account per CNIC (prevents fraud)
- ✅ **Email Verification** - Unique email constraints
- ✅ **Age Verification** - Minimum age 18+ enforcement
- ✅ **Face Image Storage** - Secure encrypted storage
- ✅ **No Credentials in Repo** - All sensitive data via environment variables

### Future Security Features
- 🔒 **Facial Recognition** - Verify user identity during transactions
- 🧠 **Emotion Detection** - Detect distress/coercion attempts
- 🎭 **Liveness Detection** - Prevent spoofing with live face detection
- 📱 **Biometric Authentication** - Fingerprint/face unlock
- 🔐 **End-to-End Encryption** - Encrypted communication channels

### Environment Variables
```env
DATABASE_URL=sqlite:///./microfinance.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
TOKEN_EXPIRE_MINUTES=60
```

---

## 📊 Database Schema

### Users Table
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | Integer | PK | Unique identifier |
| name | String | NN | Full name |
| father_name | String | NN | Father's name |
| date_of_birth | Date | NN | Age verification |
| email | String | UQ, NN | Email contact |
| cnic | String(13) | UQ, NN | National ID (fraud prevention) |
| username | String | UQ, NN | Login username |
| password_hash | String | NN | Bcrypt hashed password |
| face_image_path | String | Nullable | Stored face image |
| balance | Float | Default: 0.0 | Account balance |
| created_at | DateTime | Auto | Registration timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

---

## 🧪 Testing

### Backend Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest backend/test_signup_local.py -v

# Run with coverage
pytest --cov=backend tests/
```

### Manual Testing (Swagger UI)

1. Navigate to `http://localhost:8005/docs`
2. Try out endpoints with the interactive UI
3. Test signup, login, and user retrieval flows

### Frontend Testing

```bash
# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web (Expo)
npm start
```

---

## 🚦 Development Roadmap

### ✅ Completed
- [x] User authentication system
- [x] JWT token management
- [x] Database schema & models
- [x] API endpoint structure
- [x] Input validation
- [x] Password hashing

### 🔄 In Progress
- [ ] Dashboard screen
- [ ] Money transfer functionality
- [ ] Transaction history
- [ ] Notification system

### 📋 Planned
- [ ] Facial recognition model
- [ ] Emotion detection algorithm
- [ ] Gesture-based liveness detection
- [ ] Advanced fraud detection
- [ ] Push notifications
- [ ] Transaction analytics

---

## 🐛 Troubleshooting

### Backend Issues

| Issue | Solution |
|-------|----------|
| **Database locked** | Close other connections; restart server |
| **ModuleNotFoundError** | Activate virtual env: `source venv/bin/activate` |
| **Port 8005 in use** | Change port: `uvicorn main:app --port 8006` |
| **Import errors** | Run: `pip install -r requirements.txt` |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| **Camera permission denied** | Check phone settings > App permissions |
| **Cannot reach API** | Verify API_BASE_URL in `src/services/api.js` |
| **Android emulator can't connect** | Use `10.0.2.2` instead of `localhost` |
| **Build errors** | Clear cache: `npm start -- --reset-cache` |

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Native Docs](https://reactnative.dev)
- [SQLAlchemy ORM](https://sqlalchemy.org)
- [JWT Authentication](https://jwt.io)
- [MediaPipe Face Detection](https://developers.google.com/mediapipe)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is for **educational purposes only**. Use at your own risk.

---

## 👤 Author

**Ammad Ajaz**

- GitHub: [@Ammad-10](https://github.com/Ammad-10)
- Project: [Emotion Detection Repository](https://github.com/Ammad-10/Emotion-Detection)

---

## 🎓 Project Metadata

**Topics:** `fastapi` `react-native` `postgresql` `jwt-authentication` `emotion-detection` `facial-recognition` `mobile-app` `fintech` `python` `microfinance`

**Description:** AI-powered micro-finance mobile app with emotion detection security. FastAPI + React Native + PostgreSQL. Prevents coerced transactions.

---

**Ammad Ajaz** — Data & AI Engineer
- GitHub: [github.com/Ammad-10](https://github.com/Ammad-10)
- LinkedIn: [linkedin.com/in/ammadajaz](https://linkedin.com/in/ammadajaz)

