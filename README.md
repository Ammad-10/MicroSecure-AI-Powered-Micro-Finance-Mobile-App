# Micro-Finance Mobile Application

A secure mobile payment and money transfer application with **AI-powered security features** that uses facial recognition and emotion detection to prevent fraudulent or coerced transactions.

## 🚀 Features

### Phase 1: Authentication System (✅ Completed)
- **User Registration** with comprehensive validation
- **Secure Login** with JWT authentication
- **Face Image Capture** during signup
- **CNIC Validation** (prevents duplicate accounts)
- **Professional UI** with gradient design and smooth animations

### Future Phases
- Balance management and money transfers
- AI-powered facial recognition
- Emotion detection for transaction security
- Transaction history and analytics

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL/SQLite** - Database
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing

### Frontend
- **React Native** - Cross-platform mobile development
- **React Navigation** - Navigation management
- **Vision Camera** - Camera integration
- **Axios** - HTTP client
- **Linear Gradient** - Beautiful UI gradients

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **npm or yarn**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## 🔧 Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values as needed (default SQLite configuration works out of the box)

6. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8005
   ```

   The API will be available at `http://localhost:8005`
   
   API Documentation: `http://localhost:8005/docs`

### Frontend Setup

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API URL:**
   - Open `src/services/api.js`
   - Update `API_BASE_URL` to your backend URL
   - For Android emulator: `http://10.0.2.2:8005`
   - For iOS simulator: `http://localhost:8005`
   - For physical device: `http://10.54.14.135:8005`

4. **Install iOS dependencies (macOS only):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

5. **Run the app:**
   - Android:
     ```bash
     npm run android
     ```
   - iOS:
     ```bash
     npm run ios
     ```

## 📱 App Screens

### 1. Welcome Screen
- App branding and features
- Login and Signup buttons
- Premium gradient design

### 2. Login Screen
- Username and password fields
- Form validation
- Password visibility toggle
- Error handling with popups

### 3. Signup Screen
- Comprehensive registration form:
  - Full Name
  - Father's Name
  - Date of Birth (age 18+ validation)
  - Email (format validation)
  - CNIC (13 digits, uniqueness check)
  - Username (uniqueness check)
  - Password (strength validation)
  - Face Image (camera capture)
- Real-time validation
- Professional UI with camera integration

## 🔐 Security Features

### Current Implementation
- **Password Hashing** - Bcrypt for secure password storage
- **JWT Tokens** - Secure authentication
- **CNIC Uniqueness** - One account per CNIC
- **Input Validation** - Comprehensive client and server-side validation
- **Face Image Storage** - Secure file storage for future AI integration

### Future Implementation
- **Facial Recognition** - Verify user identity during transactions
- **Emotion Detection** - Cancel transactions if user appears distressed
- **AI Security Model** - Prevent coerced transactions

## 📊 Database Schema

### User Table
| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary Key |
| name | String | Not Null |
| father_name | String | Not Null |
| date_of_birth | Date | Not Null |
| email | String | Unique, Not Null |
| cnic | String(13) | Unique, Not Null |
| username | String | Unique, Not Null |
| password_hash | String | Not Null |
| face_image_path | String | Nullable |
| balance | Float | Default: 0.0 |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

## 🧪 Testing

### Backend Testing
1. Start the backend server
2. Open API documentation at `http://localhost:8005/docs`
3. Test endpoints:
   - `POST /api/auth/signup` - Create a new user
   - `POST /api/auth/login` - Login with credentials
   - `GET /api/auth/me` - Get current user info (requires token)

### Frontend Testing
1. Run the mobile app
2. Test signup flow with all validations
3. Test login flow
4. Verify error messages for invalid inputs
5. Test camera integration for face capture

## 🐛 Troubleshooting

### Backend Issues
- **Database locked error**: Close any other connections to the database
- **Module not found**: Ensure virtual environment is activated and dependencies are installed
- **Port already in use**: Change port in uvicorn command: `uvicorn main:app --port 8006`

### Frontend Issues
- **Camera permission denied**: Check app permissions in device settings
- **Network error**: Verify API_BASE_URL is correct for your setup
- **Build errors**: Clear cache with `npm start -- --reset-cache`
- **Android emulator can't reach localhost**: Use `10.0.2.2` instead of `localhost`

## 📝 API Endpoints

### Authentication

#### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "father_name": "Richard Doe",
  "date_of_birth": "1990-01-01",
  "email": "john@example.com",
  "cnic": "1234567890123",
  "username": "johndoe",
   "password": "<REDACTED_PASSWORD>",
  "face_image": "base64_encoded_image_string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
   "password": "<REDACTED_PASSWORD>"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

## 🎨 Design Philosophy

- **Premium Aesthetics** - Vibrant gradients and modern design
- **User-Friendly** - Intuitive navigation and clear feedback
- **Professional** - Polished UI with smooth animations
- **Secure** - Multiple layers of validation and security

## 🚦 Next Steps

1. ✅ Complete authentication system
2. 🔄 Build main dashboard
3. 🔄 Implement money transfer functionality
4. 🔄 Develop AI facial recognition model
5. 🔄 Integrate emotion detection
6. 🔄 Add transaction history
7. 🔄 Implement notifications

## 📄 License

This project is for educational purposes.

## 👥 Contributors

- **Developer**: Ammad Ajaz

---

<!-- 
GITHUB REPOSITORY METADATA
===========================

REPO DESCRIPTION:
AI-powered micro-finance mobile app with emotion detection security. FastAPI + React Native + PostgreSQL. Prevents coerced transactions.

TOPICS TO ADD:
fastapi, react-native, postgresql, jwt-authentication, emotion-detection, facial-recognition, mobile-app, fintech, python, microfinance

(Copy the description and topics above into your GitHub repository settings)
-->

**Built with ❤️ using React Native and FastAPI**
