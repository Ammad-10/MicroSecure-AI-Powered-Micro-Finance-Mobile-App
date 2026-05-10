from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    father_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    cnic = Column(String(13), unique=True, index=True, nullable=False)
    phone_number = Column(String(11), unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    face_image_path = Column(String, nullable=True)
    balance = Column(Float, default=1000.0, nullable=False) # Start with 1,000 for all users
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to transactions
    transactions = relationship("Transaction", back_populates="user")

    def __repr__(self):
        return f"<User(username='{self.username}', cnic='{self.cnic}')>"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) # 'bill_payment', 'transfer', etc.
    amount = Column(Float, nullable=False)
    psid = Column(String(13), nullable=True) # 13-digit PSID
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to user
    user = relationship("User", back_populates="transactions")
