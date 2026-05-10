# AI Micro-Finance App — Project Summary

## Overview
A secure mobile payment and money transfer application (similar to EasyPaisa/JazzCash) with **AI-powered security features** that uses facial recognition, emotion detection, and gesture-based liveness verification to prevent fraudulent or coerced transactions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native (Expo) |
| **Backend** | Python, FastAPI |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **Vector DB** | ChromaDB (face embeddings) |
| **AI/ML** | DeepFace, MediaPipe, OpenCV, TensorFlow |

---

## AI Models Used

### All models are **PRETRAINED** — none were custom-trained.

| Model | Source | Purpose |
|-------|--------|---------|
| **ArcFace** | DeepFace library (pretrained) | Face recognition — generates 512-dim face embeddings for identity verification |
| **Emotion Detector** | DeepFace library (pretrained) | Detects 7 emotions (angry, disgust, fear, happy, sad, surprise, neutral) to block coerced transactions |
| **Hand Landmarker** | MediaPipe (pretrained `.task` file) | Detects 21 hand landmarks for gesture-based liveness verification |
| **Face Detector** | OpenCV (pretrained Haar/DNN) | Used as the detector backend for DeepFace face detection |

> **Note:** The developer did NOT train any model from scratch. The project leverages industry-standard pretrained models through the DeepFace and MediaPipe libraries. The custom logic is in how these models are combined and the thresholds/rules applied on their outputs.

---

## Features & Flow

### 1. Authentication
- **Signup**: Name, Father's Name, DOB, Email, CNIC (13 digits), Phone (11 digits), Username, Password, Face Image capture
- **Login**: Username + Password → JWT token
- **Validations**: Unique CNIC (1 account per person), unique email/username, age 18+, password strength

### 2. Liveness Verification (Anti-Spoofing)
- **Gesture Challenge**: User must perform 2 random hand gestures (thumbs up, peace, open palm, one finger, OK sign) detected via MediaPipe
- **PPG Liveness** (Bio-Signature): Finger-on-camera redness/pulse detection to verify live tissue
- Required during signup to prevent photo-based fraud

### 3. Dashboard
- View current balance (starts at Rs. 1,000)
- Quick actions: Send Money, Pay Bills, Transaction History
- Recent transactions list with pull-to-refresh

### 4. Secure Transactions (AI-Protected)
- **Send Money**: Transfer to other users by phone number
- **Bill Payment**: Pay bills using 13-digit PSID
- **Face Verification Before Transfer**:
  1. Camera captures user's face
  2. ArcFace embedding compared to stored signup embedding (cosine similarity ≥ 0.60)
  3. Emotion analysis — transaction **blocked** if:
     - Dominant emotion is `fear` or `angry`
     - Fear or anger score > 15%
     - Sadness > 60% (prompts user to smile)
  4. Only if identity matches AND emotions are safe → transaction proceeds

### 5. Transaction Receipt
- Shows transfer details, amount, recipient info
- Share functionality

---

## Database Schema

### Users Table (SQLite)
| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary Key |
| name | String | Not Null |
| father_name | String | Not Null |
| date_of_birth | Date | Not Null |
| email | String | Unique |
| cnic | String(13) | Unique |
| phone_number | String(11) | Unique |
| username | String | Unique |
| password_hash | String | Bcrypt hashed |
| face_image_path | String | Path to saved image |
| balance | Float | Default: 1000.0 |

### Transactions Table (SQLite)
| Field | Type |
|-------|------|
| id | Integer (PK) |
| user_id | FK → users.id |
| type | String (bill_payment, transfer_sent, transfer_received) |
| amount | Float |
| psid | String(13), nullable |
| description | String |
| created_at | DateTime |

### Face Embeddings (ChromaDB)
- Collection: `faces`
- Key: CNIC
- Value: 512-dimensional ArcFace embedding vector

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user with face image |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/detect-gesture` | Hand gesture detection |
| POST | `/api/auth/verify-liveness` | PPG liveness check |
| POST | `/api/billing/pay-bill` | Pay bill by PSID |
| POST | `/api/billing/send-money` | Transfer money by phone number |
| POST | `/api/billing/verify-transaction` | Face + emotion verification |
| GET | `/api/billing/transactions` | Transaction history |

---

## Security Measures
1. **JWT Authentication** — Token-based access control
2. **Bcrypt Password Hashing** — Secure password storage
3. **Face Recognition** — Identity verification before transactions
4. **Emotion Detection** — Blocks transactions under duress (fear/anger/sadness)
5. **Gesture Liveness** — Anti-spoofing; proves a real human is present
6. **CNIC Uniqueness** — One account per national ID
7. **Temp Image Cleanup** — Verification images deleted after processing

---

## Project Structure
```
backend/                    # FastAPI Python backend
├── main.py                 # API routes & server
├── database.py             # SQLAlchemy DB setup
├── models.py               # User & Transaction ORM models
├── schemas.py              # Pydantic validation schemas
├── auth.py                 # JWT & password utilities
├── services/
│   ├── ai_service.py       # DeepFace face recognition + emotion detection
│   └── gesture_service.py  # MediaPipe hand gesture detection
├── hand_landmarker.task    # Pretrained MediaPipe model file
├── microfinance.db         # SQLite database
└── chroma_db/              # ChromaDB vector storage

mobile/                     # React Native (Expo) frontend
├── App.js                  # Navigation setup
└── src/
    ├── screens/            # All app screens
    │   ├── WelcomeScreen.js
    │   ├── LoginScreen.js
    │   ├── SignupScreen.js
    │   ├── DashboardScreen.js
    │   ├── SendMoneyScreen.js
    │   ├── BillPaymentScreen.js
    │   ├── TransactionHistoryScreen.js
    │   ├── TransferReceiptScreen.js
    │   ├── GestureLivenessScreen.js
    │   └── PPGLivenessScreen.js
    ├── services/
    │   └── api.js          # Axios API client
    └── utils/
        └── validation.js   # Form validation helpers
```
