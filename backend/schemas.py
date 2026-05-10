from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, datetime
from typing import Optional
import re

class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    father_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    email: EmailStr
    cnic: str = Field(..., min_length=13, max_length=13)
    phone_number: str = Field(..., min_length=11, max_length=11)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    face_image: str  # Base64 encoded image

    @field_validator('cnic')
    @classmethod
    def validate_cnic(cls, v):
        if not re.match(r'^\d{13}$', v):
            raise ValueError('CNIC must be exactly 13 digits')
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('User must be at least 18 years old')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    father_name: str
    date_of_birth: date
    email: str
    cnic: str
    phone_number: str
    username: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None

class BillPayment(BaseModel):
    psid: str = Field(..., min_length=13, max_length=13)
    amount: float = Field(..., gt=0)

    @field_validator('psid')
    @classmethod
    def validate_psid(cls, v):
        if not re.match(r'^\d{13}$', v):
            raise ValueError('PSID must be exactly 13 numeric digits')
        return v

class TransactionVerification(BaseModel):
    cnic: str
    face_image: str # Base64

class SendMoney(BaseModel):
    recipient_phone: str = Field(..., min_length=11, max_length=11)
    amount: float = Field(..., gt=0)

class TransactionResponse(BaseModel):
    id: int
    type: str
    amount: float
    psid: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class LivenessRequest(BaseModel):
    frames: list[str]

class LivenessResponse(BaseModel):
    alive: bool
    confidence: float
    message: str
