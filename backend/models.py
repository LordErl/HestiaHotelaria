"""
Hestia Database Models - SQLAlchemy
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from database import Base
import enum

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

# ==================== ENUMS ====================

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    RECEPTIONIST = "receptionist"
    HOUSEKEEPER = "housekeeper"
    GUEST = "guest"

class RoomStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    BLOCKED = "blocked"

class ReservationStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"

class PaymentProvider(str, enum.Enum):
    STRIPE = "stripe"
    MERCADO_PAGO = "mercado_pago"
    CORA = "cora"
    CASH = "cash"
    PIX = "pix"

# ==================== MODELS ====================

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.RECEPTIONIST.value, index=True)
    hotel_id = Column(String(36), ForeignKey('hotels.id', ondelete='SET NULL'), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    hotel = relationship('Hotel', back_populates='users')


class Hotel(Base):
    __tablename__ = 'hotels'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    country = Column(String(100))
    phone = Column(String(50))
    email = Column(String(255))
    stars = Column(Integer, default=5)
    description = Column(Text)
    amenities = Column(JSON, default=list)
    payment_providers = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    users = relationship('User', back_populates='hotel')
    room_types = relationship('RoomType', back_populates='hotel', cascade='all, delete-orphan')
    rooms = relationship('Room', back_populates='hotel', cascade='all, delete-orphan')
    guests = relationship('Guest', back_populates='hotel', cascade='all, delete-orphan')
    reservations = relationship('Reservation', back_populates='hotel', cascade='all, delete-orphan')


class RoomType(Base):
    __tablename__ = 'room_types'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    base_price = Column(Float, nullable=False)
    max_occupancy = Column(Integer, default=2)
    amenities = Column(JSON, default=list)
    images = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    hotel = relationship('Hotel', back_populates='room_types')
    rooms = relationship('Room', back_populates='room_type')


class Room(Base):
    __tablename__ = 'rooms'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False, index=True)
    room_type_id = Column(String(36), ForeignKey('room_types.id', ondelete='CASCADE'), nullable=False, index=True)
    number = Column(String(20), nullable=False)
    floor = Column(Integer, default=1)
    status = Column(String(50), default=RoomStatus.AVAILABLE.value, index=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    hotel = relationship('Hotel', back_populates='rooms')
    room_type = relationship('RoomType', back_populates='rooms')
    reservations = relationship('Reservation', back_populates='room')


class Guest(Base):
    __tablename__ = 'guests'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True)
    phone = Column(String(50))
    document_type = Column(String(20), default='cpf')
    document_number = Column(String(50), index=True)
    nationality = Column(String(10), default='BR')
    address = Column(String(500))
    city = Column(String(100))
    country = Column(String(100), default='Brasil')
    notes = Column(Text)
    preferences = Column(JSON, default=dict)
    total_stays = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    vip_status = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    hotel = relationship('Hotel', back_populates='guests')
    reservations = relationship('Reservation', back_populates='guest')


class Reservation(Base):
    __tablename__ = 'reservations'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hotel_id = Column(String(36), ForeignKey('hotels.id', ondelete='CASCADE'), nullable=False, index=True)
    guest_id = Column(String(36), ForeignKey('guests.id', ondelete='CASCADE'), nullable=False, index=True)
    room_id = Column(String(36), ForeignKey('rooms.id', ondelete='SET NULL'), nullable=True, index=True)
    room_type_id = Column(String(36), ForeignKey('room_types.id', ondelete='SET NULL'), nullable=True)
    check_in_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    check_out_date = Column(String(10), nullable=False, index=True)
    actual_check_in = Column(DateTime(timezone=True))
    actual_check_out = Column(DateTime(timezone=True))
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    status = Column(String(50), default=ReservationStatus.PENDING.value, index=True)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    payment_status = Column(String(50), default=PaymentStatus.PENDING.value)
    payment_provider = Column(String(50))
    confirmation_code = Column(String(20), unique=True, index=True)
    notes = Column(Text)
    source = Column(String(50), default='direct')
    created_by = Column(String(36))
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    hotel = relationship('Hotel', back_populates='reservations')
    guest = relationship('Guest', back_populates='reservations')
    room = relationship('Room', back_populates='reservations')


class ChatHistory(Base):
    __tablename__ = 'chat_history'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), nullable=False, index=True)
    agent_type = Column(String(20))  # hestia or jarbas
    user_id = Column(String(36), index=True)
    guest_id = Column(String(36), index=True)
    user_message = Column(Text)
    ai_response = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utc_now)
