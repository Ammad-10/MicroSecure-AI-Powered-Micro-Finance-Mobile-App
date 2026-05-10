from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import base64
import os
from pathlib import Path
import uuid
from services import ai_service
from services.gesture_service import get_gesture_detector

from database import engine, get_db, Base
from models import User, Transaction
from schemas import UserSignup, UserLogin, UserResponse, Token, BillPayment, TransactionResponse, SendMoney, TransactionVerification, LivenessRequest, LivenessResponse
from auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create upload directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads/face_images")
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Micro-Finance API",
    description="Backend API for micro-finance mobile application",
    version="1.0.0"
)

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Micro-Finance API",
        "version": "1.0.0",
        "status": "running"
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    print(f"[VALIDATION ERROR] {errors}")
    # Format errors into readable messages
    messages = []
    for err in errors:
        field = " -> ".join(str(x) for x in err.get('loc', []))
        msg = err.get('msg', 'Unknown error')
        messages.append(f"{field}: {msg}")
    detail = "; ".join(messages)
    return JSONResponse(status_code=422, content={"detail": detail})

@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user with comprehensive validations
    
    Validations:
    - Email must be unique and valid format
    - CNIC must be unique and exactly 13 digits
    - Username must be unique
    - Password must be at least 8 characters with letters and digits
    - User must be at least 18 years old
    - All fields are required
    """
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if CNIC already exists (prevent duplicate accounts)
    existing_cnic = db.query(User).filter(User.cnic == user_data.cnic).first()
    if existing_cnic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CNIC already registered. Only one account per CNIC is allowed."
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if phone number already exists
    existing_phone = db.query(User).filter(User.phone_number == user_data.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Save face image
    face_image_path = None
    
    # Step 1: Decode base64 and save image file (required for signup)
    try:
        # Decode base64 image
        image_data = base64.b64decode(user_data.face_image)
        
        # Generate unique filename
        filename = f"{user_data.cnic}_{uuid.uuid4()}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Save image
        with open(filepath, "wb") as f:
            f.write(image_data)
        
        face_image_path = filepath
        print(f"Face image saved: {filepath} ({len(image_data)} bytes)")
    except Exception as e:
        print(f"Image save error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save face image: {str(e)}"
        )
    
    # Step 2: AI face embedding (non-blocking — signup succeeds even if this fails)
    if face_image_path:
        try:
            ai_service.add_face_embedding(user_data.cnic, face_image_path)
            print(f"Face embedding stored for CNIC {user_data.cnic}")
        except Exception as ai_e:
            # Log warning but don't block signup — embedding can be retried during transaction verification
            print(f"WARNING: Face embedding failed for CNIC {user_data.cnic}: {ai_e}")
            print("Signup will continue — face image is saved, embedding can be generated later.")
    
    # Create new user
    new_user = User(
        name=user_data.name,
        father_name=user_data.father_name,
        date_of_birth=user_data.date_of_birth,
        email=user_data.email,
        cnic=user_data.cnic,
        phone_number=user_data.phone_number,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        face_image_path=face_image_path,
        balance=1000.0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.post("/api/auth/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token
    """
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return current_user


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/api/auth/verify-liveness", response_model=LivenessResponse)
def verify_liveness(data: LivenessRequest):
    """
    Verify liveness using a sequence of frames
    """
    result = ai_service.analyze_liveness(data.frames)
    return result

@app.post("/api/auth/detect-gesture")
def detect_gesture_endpoint(data: LivenessRequest):
    """
    Detect hand gesture in a single frame
    """
    if not data.frames:
        raise HTTPException(status_code=400, detail="No frames provided")
    
    # Process only the first frame (single frame detection)
    try:
        detector = get_gesture_detector()
        result = detector.detect_gesture_in_frame(data.frames[0])
        return result
    except Exception as e:
        print(f"[detect-gesture] Error: {e}")
        # Return a valid response instead of 500 so the client can retry
        return {"gesture": "none", "confidence": 0, "hand_detected": False, "error": str(e)}


@app.post("/api/billing/pay-bill", response_model=TransactionResponse)
def pay_bill(payment: BillPayment, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Pay a bill using a 13-digit PSID
    Deducts balance from user account and records transaction
    """
    if current_user.balance < payment.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance"
        )
    
    # Deduct balance
    current_user.balance -= payment.amount
    
    # Create transaction record
    new_transaction = Transaction(
        user_id=current_user.id,
        type="bill_payment",
        amount=payment.amount,
        psid=payment.psid,
        description=f"Bill payment for PSID: {payment.psid}"
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    return new_transaction


@app.get("/api/billing/transactions", response_model=list[TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all transactions for the current user
    """
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.created_at.desc()).all()
    return transactions


@app.post("/api/billing/send-money", response_model=TransactionResponse)
def send_money(transfer: SendMoney, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Send money to another user by their username
    Deducts balance from sender and adds to recipient
    """
    if transfer.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    if current_user.balance < transfer.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    if current_user.phone_number == transfer.recipient_phone:
        raise HTTPException(status_code=400, detail="You cannot send money to yourself")
    
    # Find recipient by phone number
    recipient = db.query(User).filter(User.phone_number == transfer.recipient_phone).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient phone number not found")

    # Perform transfer
    current_user.balance -= transfer.amount
    recipient.balance += transfer.amount

    # Create transaction record for sender
    new_transaction = Transaction(
        user_id=current_user.id,
        type="transfer_sent",
        amount=transfer.amount,
        description=f"Sent to {recipient.phone_number} ({recipient.name})"
    )
    
    # Create transaction record for recipient
    recipient_transaction = Transaction(
        user_id=recipient.id,
        type="transfer_received",
        amount=transfer.amount,
        description=f"Received from {current_user.phone_number} ({current_user.name})"
    )

    db.add(new_transaction)
    db.add(recipient_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction




@app.post("/api/billing/verify-transaction")
def verify_transaction_endpoint(data: TransactionVerification, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Save temp image
    try:
        image_data = base64.b64decode(data.face_image)
        filename = f"verify_{data.cnic}_{uuid.uuid4()}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(image_data)
            
        # Verify
        result = ai_service.verify_transaction(data.cnic, filepath)
        
        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)
            
        if not result["verified"]:
            if result["message"].startswith("Transaction blocked"):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=result["message"])
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["message"])
                
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
