from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'hestia_default_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Hestia Hotel Management Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== ENUMS ==================
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    RECEPTIONIST = "receptionist"
    HOUSEKEEPER = "housekeeper"
    GUEST = "guest"

class RoomStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    BLOCKED = "blocked"

class ReservationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"

class PaymentProvider(str, Enum):
    STRIPE = "stripe"
    MERCADO_PAGO = "mercado_pago"
    CORA = "cora"
    CASH = "cash"
    PIX = "pix"

# ================== PYDANTIC MODELS ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.RECEPTIONIST
    hotel_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    hotel_id: Optional[str] = None
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class HotelCreate(BaseModel):
    name: str
    address: str
    city: str
    country: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    stars: int = 5
    description: Optional[str] = None
    amenities: List[str] = []
    payment_providers: List[str] = ["stripe"]

class RoomTypeCreate(BaseModel):
    name: str
    hotel_id: str
    description: Optional[str] = None
    base_price: float
    max_occupancy: int = 2
    amenities: List[str] = []
    images: List[str] = []

class RoomCreate(BaseModel):
    number: str
    hotel_id: str
    room_type_id: str
    floor: int = 1
    status: RoomStatus = RoomStatus.AVAILABLE
    notes: Optional[str] = None

class RoomUpdate(BaseModel):
    status: Optional[RoomStatus] = None
    notes: Optional[str] = None

class GuestCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    document_type: str = "cpf"
    document_number: str
    nationality: str = "BR"
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Brasil"
    notes: Optional[str] = None
    preferences: Dict[str, Any] = {}

class ReservationCreate(BaseModel):
    hotel_id: str
    guest_id: str
    room_id: str
    room_type_id: str
    check_in_date: str
    check_out_date: str
    adults: int = 1
    children: int = 0
    total_amount: float
    notes: Optional[str] = None
    source: str = "direct"

class ReservationUpdate(BaseModel):
    status: Optional[ReservationStatus] = None
    room_id: Optional[str] = None
    notes: Optional[str] = None
    paid_amount: Optional[float] = None
    payment_status: Optional[PaymentStatus] = None

class DashboardStats(BaseModel):
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    occupancy_rate: float
    todays_checkins: int
    todays_checkouts: int
    pending_reservations: int
    revenue_today: float
    revenue_month: float
    guests_in_house: int

class ChatRequest(BaseModel):
    message: str
    agent_type: str = "jarbas"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": user_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        result = supabase.table('users').select('*').eq('id', user_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        user = result.data
        user.pop('password_hash', None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = supabase.table('users').select('id').eq('email', user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    user_dict = {
        'id': user_id,
        'email': user_data.email,
        'name': user_data.name,
        'role': user_data.role.value,
        'hotel_id': user_data.hotel_id,
        'password_hash': hash_password(user_data.password),
        'is_active': True
    }
    
    supabase.table('users').insert(user_dict).execute()
    token = create_access_token(user_id, user_data.email, user_data.role.value)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, role=user_data.role.value, hotel_id=user_data.hotel_id, is_active=True)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    result = supabase.table('users').select('*').eq('email', credentials.email).single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    user = result.data
    if not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = create_access_token(user['id'], user['email'], user['role'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user['id'], email=user['email'], name=user['name'], role=user['role'], hotel_id=user.get('hotel_id'), is_active=user.get('is_active', True))
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ================== HOTEL ROUTES ==================

@api_router.post("/hotels")
async def create_hotel(hotel_data: HotelCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    hotel_id = str(uuid.uuid4())
    hotel_dict = {'id': hotel_id, **hotel_data.model_dump(), 'is_active': True}
    supabase.table('hotels').insert(hotel_dict).execute()
    return {**hotel_dict}

@api_router.get("/hotels")
async def get_hotels(current_user: dict = Depends(get_current_user)):
    result = supabase.table('hotels').select('*').execute()
    return result.data

@api_router.get("/hotels/{hotel_id}")
async def get_hotel(hotel_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table('hotels').select('*').eq('id', hotel_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Hotel não encontrado")
    return result.data

# ================== ROOM TYPE ROUTES ==================

@api_router.post("/room-types")
async def create_room_type(room_type_data: RoomTypeCreate, current_user: dict = Depends(get_current_user)):
    rt_id = str(uuid.uuid4())
    rt_dict = {'id': rt_id, **room_type_data.model_dump()}
    supabase.table('room_types').insert(rt_dict).execute()
    return {**rt_dict}

@api_router.get("/room-types")
async def get_room_types(hotel_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table('room_types').select('*')
    if hotel_id:
        query = query.eq('hotel_id', hotel_id)
    result = query.execute()
    return result.data

# ================== ROOM ROUTES ==================

@api_router.post("/rooms")
async def create_room(room_data: RoomCreate, current_user: dict = Depends(get_current_user)):
    room_id = str(uuid.uuid4())
    room_dict = {'id': room_id, **room_data.model_dump()}
    room_dict['status'] = room_dict['status'].value if hasattr(room_dict['status'], 'value') else room_dict['status']
    supabase.table('rooms').insert(room_dict).execute()
    return {**room_dict}

@api_router.get("/rooms")
async def get_rooms(hotel_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table('rooms').select('*')
    if hotel_id:
        query = query.eq('hotel_id', hotel_id)
    if status:
        query = query.eq('status', status)
    result = query.execute()
    return result.data

@api_router.patch("/rooms/{room_id}")
async def update_room(room_id: str, room_update: RoomUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in room_update.model_dump().items() if v is not None}
    if 'status' in update_data and hasattr(update_data['status'], 'value'):
        update_data['status'] = update_data['status'].value
    
    result = supabase.table('rooms').update(update_data).eq('id', room_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Quarto não encontrado")
    return result.data[0]

# ================== GUEST ROUTES ==================

@api_router.post("/guests")
async def create_guest(guest_data: GuestCreate, hotel_id: str, current_user: dict = Depends(get_current_user)):
    guest_id = str(uuid.uuid4())
    guest_dict = {'id': guest_id, 'hotel_id': hotel_id, **guest_data.model_dump(), 'total_stays': 0, 'total_spent': 0, 'vip_status': False}
    supabase.table('guests').insert(guest_dict).execute()
    return {**guest_dict}

@api_router.get("/guests")
async def get_guests(hotel_id: Optional[str] = None, search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table('guests').select('*')
    if hotel_id:
        query = query.eq('hotel_id', hotel_id)
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,document_number.ilike.%{search}%")
    result = query.execute()
    return result.data

@api_router.get("/guests/{guest_id}")
async def get_guest(guest_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table('guests').select('*').eq('id', guest_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Hóspede não encontrado")
    return result.data

# ================== RESERVATION ROUTES ==================

@api_router.post("/reservations")
async def create_reservation(res_data: ReservationCreate, current_user: dict = Depends(get_current_user)):
    res_id = str(uuid.uuid4())
    res_dict = {
        'id': res_id,
        **res_data.model_dump(),
        'status': 'pending',
        'paid_amount': 0,
        'payment_status': 'pending',
        'created_by': current_user['id']
    }
    supabase.table('reservations').insert(res_dict).execute()
    supabase.table('rooms').update({'status': 'blocked'}).eq('id', res_data.room_id).execute()
    return {**res_dict}

@api_router.get("/reservations")
async def get_reservations(hotel_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table('reservations').select('*')
    if hotel_id:
        query = query.eq('hotel_id', hotel_id)
    if status:
        query = query.eq('status', status)
    result = query.order('created_at', desc=True).execute()
    return result.data

@api_router.get("/reservations/{reservation_id}")
async def get_reservation(reservation_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table('reservations').select('*').eq('id', reservation_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    return result.data

@api_router.patch("/reservations/{reservation_id}")
async def update_reservation(reservation_id: str, update_data: ReservationUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if 'status' in update_dict and hasattr(update_dict['status'], 'value'):
        update_dict['status'] = update_dict['status'].value
    if 'payment_status' in update_dict and hasattr(update_dict['payment_status'], 'value'):
        update_dict['payment_status'] = update_dict['payment_status'].value
    
    result = supabase.table('reservations').update(update_dict).eq('id', reservation_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    return result.data[0]

# ================== CHECK-IN/OUT ROUTES ==================

@api_router.post("/reservations/{reservation_id}/check-in")
async def do_check_in(reservation_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table('reservations').select('*').eq('id', reservation_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reservation = result.data
    if reservation['status'] not in ['pending', 'confirmed']:
        raise HTTPException(status_code=400, detail="Reserva não pode fazer check-in")
    
    now = datetime.now(timezone.utc).isoformat()
    supabase.table('reservations').update({'status': 'checked_in', 'actual_check_in': now}).eq('id', reservation_id).execute()
    supabase.table('rooms').update({'status': 'occupied'}).eq('id', reservation['room_id']).execute()
    
    return {"message": "Check-in realizado com sucesso", "check_in_time": now}

@api_router.post("/reservations/{reservation_id}/check-out")
async def do_check_out(reservation_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table('reservations').select('*').eq('id', reservation_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reservation = result.data
    if reservation['status'] != 'checked_in':
        raise HTTPException(status_code=400, detail="Reserva não está em check-in")
    
    now = datetime.now(timezone.utc).isoformat()
    supabase.table('reservations').update({'status': 'checked_out', 'actual_check_out': now}).eq('id', reservation_id).execute()
    supabase.table('rooms').update({'status': 'cleaning'}).eq('id', reservation['room_id']).execute()
    
    # Update guest stats manually (increment total_stays and total_spent)
    guest_result = supabase.table('guests').select('total_stays,total_spent').eq('id', reservation['guest_id']).single().execute()
    if guest_result.data:
        current_stays = guest_result.data.get('total_stays') or 0
        current_spent = float(guest_result.data.get('total_spent') or 0)
        supabase.table('guests').update({
            'total_stays': current_stays + 1,
            'total_spent': current_spent + float(reservation.get('total_amount') or 0)
        }).eq('id', reservation['guest_id']).execute()
    
    return {"message": "Check-out realizado com sucesso", "check_out_time": now}

# ================== DASHBOARD ROUTES ==================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(hotel_id: str, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    month_start = datetime.now(timezone.utc).strftime('%Y-%m-01')
    
    # Room stats
    rooms_result = supabase.table('rooms').select('status').eq('hotel_id', hotel_id).execute()
    rooms = rooms_result.data or []
    total_rooms = len(rooms)
    occupied_rooms = len([r for r in rooms if r.get('status') == 'occupied'])
    available_rooms = len([r for r in rooms if r.get('status') == 'available'])
    
    # Reservation stats
    res_result = supabase.table('reservations').select('*').eq('hotel_id', hotel_id).execute()
    reservations = res_result.data or []
    
    todays_checkins = len([r for r in reservations if r.get('check_in_date') == today and r.get('status') in ['pending', 'confirmed']])
    todays_checkouts = len([r for r in reservations if r.get('check_out_date') == today and r.get('status') == 'checked_in'])
    pending_reservations = len([r for r in reservations if r.get('status') == 'pending'])
    guests_in_house = len([r for r in reservations if r.get('status') == 'checked_in'])
    
    # Revenue - handle None values
    revenue_today = sum(float(r.get('total_amount') or 0) for r in reservations if (r.get('actual_check_out') or '').startswith(today))
    revenue_month = sum(float(r.get('total_amount') or 0) for r in reservations if (r.get('actual_check_out') or '').startswith(month_start[:7]))
    
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    return DashboardStats(
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms,
        available_rooms=available_rooms,
        occupancy_rate=round(occupancy_rate, 1),
        todays_checkins=todays_checkins,
        todays_checkouts=todays_checkouts,
        pending_reservations=pending_reservations,
        revenue_today=revenue_today,
        revenue_month=revenue_month,
        guests_in_house=guests_in_house
    )

@api_router.get("/dashboard/occupancy-chart")
async def get_occupancy_chart(hotel_id: str, days: int = 7, current_user: dict = Depends(get_current_user)):
    rooms_result = supabase.table('rooms').select('id').eq('hotel_id', hotel_id).execute()
    total_rooms = len(rooms_result.data)
    
    res_result = supabase.table('reservations').select('check_in_date,check_out_date,status').eq('hotel_id', hotel_id).execute()
    reservations = res_result.data
    
    data = []
    for i in range(days - 1, -1, -1):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        occupied = len([r for r in reservations if r['check_in_date'] <= date < r['check_out_date'] and r['status'] in ['checked_in', 'checked_out']])
        occupancy = (occupied / total_rooms * 100) if total_rooms > 0 else 0
        data.append({"date": date, "occupancy": round(occupancy, 1), "occupied": occupied, "total": total_rooms})
    
    return data

@api_router.get("/dashboard/revenue-chart")
async def get_revenue_chart(hotel_id: str, days: int = 7, current_user: dict = Depends(get_current_user)):
    res_result = supabase.table('reservations').select('actual_check_out,total_amount').eq('hotel_id', hotel_id).execute()
    reservations = res_result.data
    
    data = []
    for i in range(days - 1, -1, -1):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        revenue = sum(float(r['total_amount'] or 0) for r in reservations if (r.get('actual_check_out') or '').startswith(date))
        data.append({"date": date, "revenue": revenue})
    
    return data

# ================== PUBLIC PAYMENT PROVIDERS ==================

@api_router.get("/public/payment-providers/{hotel_id}")
async def get_public_payment_providers(hotel_id: str):
    """Get active payment providers for public booking"""
    result = supabase.table('payment_providers').select('id,provider_name,display_name,supported_methods,is_active').eq('hotel_id', hotel_id).eq('is_active', True).order('priority').execute()
    return result.data

# ================== EMAIL NOTIFICATIONS ==================

import resend
import asyncio

# Resend requires a verified domain. For testing, use onboarding@resend.dev
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email asynchronously"""
    resend_key = os.environ.get('RESEND_API_KEY')
    if not resend_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return None
    
    resend.api_key = resend_key
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return None

def get_reservation_confirmation_html(reservation: dict, hotel: dict, room_type: dict, guest: dict) -> str:
    """Generate HTML for reservation confirmation email"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B1120; color: #F8FAFC; margin: 0; padding: 40px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #151E32; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: #0B1120; margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; }}
            .confirmation-code {{ font-size: 32px; font-weight: bold; color: #D4AF37; text-align: center; margin: 20px 0; padding: 20px; background-color: #0B1120; border-radius: 8px; }}
            .details {{ background-color: #0B1120; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .details-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1E3A5F; }}
            .details-row:last-child {{ border-bottom: none; }}
            .label {{ color: #94A3B8; }}
            .value {{ color: #F8FAFC; font-weight: 500; }}
            .total {{ font-size: 24px; color: #D4AF37; font-weight: bold; text-align: right; margin-top: 20px; }}
            .footer {{ text-align: center; padding: 20px; color: #94A3B8; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✨ Reserva Confirmada</h1>
            </div>
            <div class="content">
                <p>Olá, <strong>{guest.get('full_name', 'Hóspede')}</strong>!</p>
                <p>Sua reserva no <strong>{hotel.get('name', 'Hotel')}</strong> foi confirmada com sucesso.</p>
                
                <div class="confirmation-code">
                    {reservation.get('confirmation_code', reservation.get('id', '')[:8].upper())}
                </div>
                
                <div class="details">
                    <div class="details-row">
                        <span class="label">Hotel</span>
                        <span class="value">{hotel.get('name', '')}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Acomodação</span>
                        <span class="value">{room_type.get('name', '')}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Check-in</span>
                        <span class="value">{reservation.get('check_in_date', '')}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Check-out</span>
                        <span class="value">{reservation.get('check_out_date', '')}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Hóspedes</span>
                        <span class="value">{reservation.get('adults', 1)} adulto(s)</span>
                    </div>
                </div>
                
                <div class="total">
                    Total: R$ {reservation.get('total_amount', 0):,.2f}
                </div>
                
                <p style="margin-top: 30px;">
                    Acesse o <a href="#" style="color: #D4AF37;">Portal do Hóspede</a> com seu código de confirmação para mais informações.
                </p>
            </div>
            <div class="footer">
                <p>© 2024 Hestia Hotel Management</p>
                <p>Este é um email automático, não responda.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_payment_confirmation_html(reservation: dict, payment: dict, hotel: dict) -> str:
    """Generate HTML for payment confirmation email"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B1120; color: #F8FAFC; margin: 0; padding: 40px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #151E32; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; }}
            .amount {{ font-size: 40px; font-weight: bold; color: #10B981; text-align: center; margin: 20px 0; }}
            .details {{ background-color: #0B1120; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #94A3B8; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Pagamento Confirmado</h1>
            </div>
            <div class="content">
                <p>Seu pagamento foi processado com sucesso!</p>
                <div class="amount">R$ {payment.get('amount', 0):,.2f}</div>
                <div class="details">
                    <p><strong>Hotel:</strong> {hotel.get('name', '')}</p>
                    <p><strong>Reserva:</strong> {reservation.get('confirmation_code', '')}</p>
                    <p><strong>Método:</strong> {payment.get('payment_method', 'PIX').upper()}</p>
                    <p><strong>ID Transação:</strong> {payment.get('external_payment_id', payment.get('id', ''))}</p>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 Hestia Hotel Management</p>
            </div>
        </div>
    </body>
    </html>
    """

# Update reservation creation to send email
@api_router.post("/public/reservations")
async def create_public_reservation(data: dict):
    """Create reservation from public booking engine"""
    from fastapi import BackgroundTasks
    
    # Create guest if needed
    guest_data = data.get('guest', {})
    guest_result = supabase.table('guests').select('id').eq('email', guest_data.get('email')).execute()
    
    if guest_result.data:
        guest_id = guest_result.data[0]['id']
    else:
        guest_id = str(uuid.uuid4())
        supabase.table('guests').insert({
            'id': guest_id,
            'full_name': guest_data.get('name'),
            'email': guest_data.get('email'),
            'phone': guest_data.get('phone'),
            'document_id': guest_data.get('document_number'),
            'total_stays': 0,
            'total_spent': 0
        }).execute()
    
    # Create reservation
    reservation_id = str(uuid.uuid4())
    confirmation_code = f"HES{str(uuid.uuid4())[:6].upper()}"
    
    reservation = {
        'id': reservation_id,
        'hotel_id': data.get('hotel_id'),
        'guest_id': guest_id,
        'room_id': data.get('room_id'),
        'room_type_id': data.get('room_type_id'),
        'check_in_date': data.get('check_in_date'),
        'check_out_date': data.get('check_out_date'),
        'adults': data.get('adults', 1),
        'children': data.get('children', 0),
        'total_amount': data.get('total_amount'),
        'status': 'confirmed',
        'payment_status': 'pending',
        'special_requests': guest_data.get('special_requests'),
        'confirmation_code': confirmation_code
    }
    
    supabase.table('reservations').insert(reservation).execute()
    
    # Get hotel and room type for email
    hotel_result = supabase.table('hotels').select('*').eq('id', data.get('hotel_id')).single().execute()
    room_type_result = supabase.table('room_types').select('*').eq('id', data.get('room_type_id')).single().execute()
    
    # Send confirmation email in background
    asyncio.create_task(send_email_async(
        guest_data.get('email'),
        f"Reserva Confirmada - {confirmation_code}",
        get_reservation_confirmation_html(reservation, hotel_result.data or {}, room_type_result.data or {}, {'full_name': guest_data.get('name')})
    ))
    
    return {**reservation, 'confirmation_code': confirmation_code}

# ================== REVENUE MANAGEMENT ==================

class PricingRule(BaseModel):
    room_type_id: str
    rule_type: str  # 'occupancy', 'advance_booking', 'day_of_week', 'season'
    condition: dict
    adjustment_type: str  # 'percentage', 'fixed'
    adjustment_value: float
    priority: int = 0
    is_active: bool = True

@api_router.get("/revenue/analytics")
async def get_revenue_analytics(hotel_id: str, period: str = "30d", current_user: dict = Depends(get_current_user)):
    """Get comprehensive revenue analytics"""
    days = int(period.replace('d', ''))
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')
    
    # Get reservations for period
    res_result = supabase.table('reservations').select('*').eq('hotel_id', hotel_id).gte('created_at', start_date).execute()
    reservations = res_result.data
    
    # Get rooms
    rooms_result = supabase.table('rooms').select('*').eq('hotel_id', hotel_id).execute()
    total_rooms = len(rooms_result.data)
    
    # Get room types
    types_result = supabase.table('room_types').select('*').eq('hotel_id', hotel_id).execute()
    room_types = {t['id']: t for t in types_result.data}
    
    # Calculate metrics
    total_revenue = sum(float(r.get('total_amount') or 0) for r in reservations)
    paid_reservations = [r for r in reservations if r.get('payment_status') == 'paid']
    paid_revenue = sum(float(r.get('total_amount') or 0) for r in paid_reservations)
    
    # Calculate ADR (Average Daily Rate)
    total_nights = sum(
        (datetime.strptime(r['check_out_date'], '%Y-%m-%d') - datetime.strptime(r['check_in_date'], '%Y-%m-%d')).days
        for r in reservations if r.get('check_in_date') and r.get('check_out_date')
    )
    adr = total_revenue / total_nights if total_nights > 0 else 0
    
    # Calculate RevPAR
    available_room_nights = total_rooms * days
    revpar = total_revenue / available_room_nights if available_room_nights > 0 else 0
    
    # Calculate occupancy
    occupied_nights = total_nights
    occupancy_rate = (occupied_nights / available_room_nights * 100) if available_room_nights > 0 else 0
    
    # Revenue by room type
    revenue_by_type = {}
    for r in reservations:
        type_id = r.get('room_type_id')
        type_name = room_types.get(type_id, {}).get('name', 'Outros')
        revenue_by_type[type_name] = revenue_by_type.get(type_name, 0) + float(r.get('total_amount') or 0)
    
    # Daily revenue trend
    daily_revenue = {}
    for r in reservations:
        date = r.get('created_at', '')[:10]
        daily_revenue[date] = daily_revenue.get(date, 0) + float(r.get('total_amount') or 0)
    
    # Booking lead time analysis
    lead_times = []
    for r in reservations:
        if r.get('created_at') and r.get('check_in_date'):
            created = datetime.strptime(r['created_at'][:10], '%Y-%m-%d')
            checkin = datetime.strptime(r['check_in_date'], '%Y-%m-%d')
            lead_times.append((checkin - created).days)
    avg_lead_time = sum(lead_times) / len(lead_times) if lead_times else 0
    
    return {
        'period': period,
        'total_revenue': total_revenue,
        'paid_revenue': paid_revenue,
        'pending_revenue': total_revenue - paid_revenue,
        'total_reservations': len(reservations),
        'adr': round(adr, 2),
        'revpar': round(revpar, 2),
        'occupancy_rate': round(occupancy_rate, 1),
        'avg_lead_time_days': round(avg_lead_time, 1),
        'revenue_by_room_type': revenue_by_type,
        'daily_revenue': [{'date': k, 'revenue': v} for k, v in sorted(daily_revenue.items())],
        'total_room_nights_sold': total_nights,
        'available_room_nights': available_room_nights
    }

@api_router.get("/revenue/forecast")
async def get_revenue_forecast(hotel_id: str, days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get revenue forecast based on confirmed reservations"""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    future_date = (datetime.now(timezone.utc) + timedelta(days=days)).strftime('%Y-%m-%d')
    
    # Get future reservations
    res_result = supabase.table('reservations').select('*').eq('hotel_id', hotel_id).gte('check_in_date', today).lte('check_in_date', future_date).in_('status', ['confirmed', 'checked_in']).execute()
    reservations = res_result.data
    
    # Get room types for pricing
    types_result = supabase.table('room_types').select('*').eq('hotel_id', hotel_id).execute()
    room_types = {t['id']: t for t in types_result.data}
    
    rooms_result = supabase.table('rooms').select('*').eq('hotel_id', hotel_id).execute()
    total_rooms = len(rooms_result.data)
    
    # Calculate forecast by day
    forecast = []
    for i in range(days):
        date = (datetime.now(timezone.utc) + timedelta(days=i)).strftime('%Y-%m-%d')
        day_reservations = [r for r in reservations if r['check_in_date'] <= date < r['check_out_date']]
        
        confirmed_revenue = sum(
            float(r.get('total_amount') or 0) / max(1, (datetime.strptime(r['check_out_date'], '%Y-%m-%d') - datetime.strptime(r['check_in_date'], '%Y-%m-%d')).days)
            for r in day_reservations
        )
        
        occupancy = len(day_reservations) / total_rooms * 100 if total_rooms > 0 else 0
        
        forecast.append({
            'date': date,
            'confirmed_revenue': round(confirmed_revenue, 2),
            'confirmed_rooms': len(day_reservations),
            'available_rooms': total_rooms - len(day_reservations),
            'occupancy': round(occupancy, 1)
        })
    
    total_forecast = sum(f['confirmed_revenue'] for f in forecast)
    avg_occupancy = sum(f['occupancy'] for f in forecast) / len(forecast) if forecast else 0
    
    return {
        'period_days': days,
        'total_forecast_revenue': round(total_forecast, 2),
        'avg_forecast_occupancy': round(avg_occupancy, 1),
        'daily_forecast': forecast
    }

@api_router.get("/revenue/pricing-suggestions")
async def get_pricing_suggestions(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Get dynamic pricing suggestions based on demand"""
    # Get room types
    types_result = supabase.table('room_types').select('*').eq('hotel_id', hotel_id).execute()
    room_types = types_result.data
    
    # Get rooms
    rooms_result = supabase.table('rooms').select('*').eq('hotel_id', hotel_id).execute()
    total_rooms = len(rooms_result.data)
    
    # Get next 14 days reservations
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    future = (datetime.now(timezone.utc) + timedelta(days=14)).strftime('%Y-%m-%d')
    res_result = supabase.table('reservations').select('*').eq('hotel_id', hotel_id).gte('check_in_date', today).lte('check_in_date', future).execute()
    reservations = res_result.data
    
    suggestions = []
    for room_type in room_types:
        base_price = float(room_type.get('base_price', 0))
        
        # Check demand for next 7 days
        type_reservations = [r for r in reservations if r.get('room_type_id') == room_type['id']]
        
        # Simple demand-based pricing suggestion
        if len(type_reservations) > 5:
            demand_level = 'high'
            suggested_adjustment = 15
        elif len(type_reservations) > 2:
            demand_level = 'medium'
            suggested_adjustment = 5
        else:
            demand_level = 'low'
            suggested_adjustment = -10
        
        suggested_price = base_price * (1 + suggested_adjustment / 100)
        
        suggestions.append({
            'room_type_id': room_type['id'],
            'room_type_name': room_type['name'],
            'current_price': base_price,
            'demand_level': demand_level,
            'reservations_next_14d': len(type_reservations),
            'suggested_adjustment_percent': suggested_adjustment,
            'suggested_price': round(suggested_price, 2),
            'potential_revenue_increase': round((suggested_price - base_price) * len(type_reservations), 2)
        })
    
    return suggestions

# ================== AI CHAT ROUTES ==================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    session_id = request.session_id or str(uuid.uuid4())
    
    if request.agent_type == "hestia":
        system_message = """Você é a Hestia, uma assistente de inteligência artificial para gestão hoteleira.
Você ajuda gestores e administradores de hotéis com análise de dados, insights acionáveis, interpretação de KPIs e revenue management.
Seja objetiva, analítica e profissional. Fale em português brasileiro."""
    else:
        system_message = """Você é o Jarbas, um mordomo digital elegante e acolhedor.
Você atende hóspedes de hotéis de luxo com informações, auxílio em reservas e recomendações personalizadas.
Seja educado, elegante e prestativo. Transmita hospitalidade premium. Fale em português brasileiro."""
    
    try:
        chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system_message).with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=request.message))
        
        supabase.table('chat_history').insert({
            'id': str(uuid.uuid4()),
            'session_id': session_id,
            'agent_type': request.agent_type,
            'user_id': current_user['id'],
            'user_message': request.message,
            'ai_response': response
        }).execute()
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

# ================== PAYMENT PROVIDERS CONFIG ==================

class PaymentProviderConfig(BaseModel):
    provider_name: str
    is_active: bool = False
    display_name: Optional[str] = None
    stripe_api_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    mp_access_token: Optional[str] = None
    mp_public_key: Optional[str] = None
    cora_client_id: Optional[str] = None
    cora_cert_path: Optional[str] = None
    cora_key_path: Optional[str] = None
    cora_sandbox: bool = True
    supported_methods: List[str] = []
    priority: int = 0

class PaymentProviderUpdate(BaseModel):
    is_active: Optional[bool] = None
    display_name: Optional[str] = None
    stripe_api_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    mp_access_token: Optional[str] = None
    mp_public_key: Optional[str] = None
    cora_client_id: Optional[str] = None
    cora_cert_path: Optional[str] = None
    cora_key_path: Optional[str] = None
    cora_sandbox: Optional[bool] = None
    supported_methods: Optional[List[str]] = None
    priority: Optional[int] = None

# Get payment providers for a hotel
@api_router.get("/payment-providers/{hotel_id}")
async def get_payment_providers(hotel_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    result = supabase.table('payment_providers').select('*').eq('hotel_id', hotel_id).order('priority').execute()
    
    # Mascarar chaves sensíveis
    providers = []
    for p in result.data:
        provider = {**p}
        if provider.get('stripe_api_key'):
            provider['stripe_api_key'] = '***' + provider['stripe_api_key'][-4:] if len(provider['stripe_api_key']) > 4 else '****'
        if provider.get('mp_access_token'):
            provider['mp_access_token'] = '***' + provider['mp_access_token'][-4:] if len(provider['mp_access_token']) > 4 else '****'
        providers.append(provider)
    
    return providers

# Create or update payment provider
@api_router.post("/payment-providers/{hotel_id}")
async def create_or_update_payment_provider(hotel_id: str, config: PaymentProviderConfig, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Verificar se já existe
    existing = supabase.table('payment_providers').select('id').eq('hotel_id', hotel_id).eq('provider_name', config.provider_name).execute()
    
    provider_dict = {
        'hotel_id': hotel_id,
        **config.model_dump(exclude_none=True),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    if existing.data:
        # Update
        supabase.table('payment_providers').update(provider_dict).eq('id', existing.data[0]['id']).execute()
        return {"message": f"Provedor {config.provider_name} atualizado", "id": existing.data[0]['id']}
    else:
        # Create
        provider_id = str(uuid.uuid4())
        provider_dict['id'] = provider_id
        supabase.table('payment_providers').insert(provider_dict).execute()
        return {"message": f"Provedor {config.provider_name} criado", "id": provider_id}

# Update payment provider
@api_router.patch("/payment-providers/{provider_id}")
async def update_payment_provider(provider_id: str, update: PaymentProviderUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = supabase.table('payment_providers').update(update_dict).eq('id', provider_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    return {"message": "Provedor atualizado", "data": result.data[0]}

# Delete payment provider
@api_router.delete("/payment-providers/{provider_id}")
async def delete_payment_provider(provider_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    supabase.table('payment_providers').delete().eq('id', provider_id).execute()
    return {"message": "Provedor removido"}

# Initialize default providers for hotel
@api_router.post("/payment-providers/{hotel_id}/init")
async def init_payment_providers(hotel_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Verificar se já existem provedores
    existing = supabase.table('payment_providers').select('id').eq('hotel_id', hotel_id).execute()
    if existing.data:
        return {"message": "Provedores já inicializados", "count": len(existing.data)}
    
    # Criar provedores padrão usando variáveis do .env
    default_providers = [
        {
            'id': str(uuid.uuid4()),
            'hotel_id': hotel_id,
            'provider_name': 'stripe',
            'display_name': 'Stripe (Cartão Internacional)',
            'is_active': True,
            'stripe_api_key': os.environ.get('STRIPE_API_KEY', ''),
            'supported_methods': ['credit_card'],
            'priority': 1
        },
        {
            'id': str(uuid.uuid4()),
            'hotel_id': hotel_id,
            'provider_name': 'mercado_pago',
            'display_name': 'Mercado Pago (PIX e Cartão)',
            'is_active': True,
            'mp_access_token': os.environ.get('MP_ACCESS_TOKEN', ''),
            'mp_public_key': os.environ.get('MP_PUBLIC_KEY', ''),
            'supported_methods': ['pix', 'credit_card'],
            'priority': 2
        },
        {
            'id': str(uuid.uuid4()),
            'hotel_id': hotel_id,
            'provider_name': 'cora',
            'display_name': 'CORA (PIX Bancário)',
            'is_active': False,
            'cora_client_id': os.environ.get('CORA_CLIENT_ID', ''),
            'cora_cert_path': os.environ.get('CORA_CERT_PATH', ''),
            'cora_key_path': os.environ.get('CORA_KEY_PATH', ''),
            'cora_sandbox': os.environ.get('CORA_SANDBOX', 'True').lower() == 'true',
            'supported_methods': ['pix'],
            'priority': 3
        }
    ]
    
    for provider in default_providers:
        try:
            supabase.table('payment_providers').insert(provider).execute()
        except Exception as e:
            logger.warning(f"Could not create provider {provider['provider_name']}: {e}")
    
    return {"message": "Provedores inicializados", "count": len(default_providers)}

# ================== PAYMENT PROCESSING ==================

class PaymentRequest(BaseModel):
    reservation_id: str
    provider: str  # 'stripe', 'mercado_pago', 'cora'
    payment_method: str  # 'pix', 'credit_card'
    return_url: str
    cancel_url: Optional[str] = None

class PixPaymentRequest(BaseModel):
    reservation_id: str
    provider: str  # 'mercado_pago' or 'cora'
    customer_name: str
    customer_email: str
    customer_cpf: str

# Stripe Checkout Integration
@api_router.post("/payments/stripe/checkout")
async def create_stripe_checkout(request: PaymentRequest, http_request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    # Get reservation
    res_result = supabase.table('reservations').select('*').eq('id', request.reservation_id).single().execute()
    if not res_result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reservation = res_result.data
    
    # Get provider config
    provider = supabase.table('payment_providers').select('*').eq('hotel_id', reservation['hotel_id']).eq('provider_name', 'stripe').eq('is_active', True).single().execute()
    
    api_key = provider.data.get('stripe_api_key') if provider.data else os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=400, detail="Stripe não configurado")
    
    try:
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        success_url = f"{request.return_url}?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = request.cancel_url or request.return_url
        
        checkout_request = CheckoutSessionRequest(
            amount=float(reservation['total_amount']),
            currency='brl',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'reservation_id': request.reservation_id,
                'hotel_id': reservation['hotel_id'],
                'source': 'hestia_pms'
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Save transaction
        tx_id = str(uuid.uuid4())
        supabase.table('payment_transactions').insert({
            'id': tx_id,
            'hotel_id': reservation['hotel_id'],
            'reservation_id': request.reservation_id,
            'provider': 'stripe',
            'checkout_session_id': session.session_id,
            'amount': float(reservation['total_amount']),
            'currency': 'BRL',
            'status': 'pending',
            'payment_method': 'credit_card',
            'metadata': {'checkout_url': session.url}
        }).execute()
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "transaction_id": tx_id
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar checkout: {str(e)}")

# Stripe Checkout Status
@api_router.get("/payments/stripe/status/{session_id}")
async def get_stripe_status(session_id: str, http_request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    # Get transaction
    tx_result = supabase.table('payment_transactions').select('*').eq('checkout_session_id', session_id).single().execute()
    if not tx_result.data:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    tx = tx_result.data
    
    # Get provider config
    provider = supabase.table('payment_providers').select('stripe_api_key').eq('hotel_id', tx['hotel_id']).eq('provider_name', 'stripe').single().execute()
    api_key = provider.data.get('stripe_api_key') if provider.data else os.environ.get('STRIPE_API_KEY')
    
    try:
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if paid
        if status.payment_status == 'paid':
            supabase.table('payment_transactions').update({
                'status': 'paid',
                'paid_at': datetime.now(timezone.utc).isoformat()
            }).eq('checkout_session_id', session_id).execute()
            
            # Update reservation
            supabase.table('reservations').update({
                'payment_status': 'paid',
                'paid_amount': tx['amount']
            }).eq('id', tx['reservation_id']).execute()
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Stripe status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Mercado Pago PIX Payment
@api_router.post("/payments/mercadopago/pix")
async def create_mercadopago_pix(request: PixPaymentRequest):
    import mercadopago
    
    # Get reservation
    res_result = supabase.table('reservations').select('*').eq('id', request.reservation_id).single().execute()
    if not res_result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reservation = res_result.data
    
    # Get provider config
    provider = supabase.table('payment_providers').select('*').eq('hotel_id', reservation['hotel_id']).eq('provider_name', 'mercado_pago').eq('is_active', True).single().execute()
    
    access_token = provider.data.get('mp_access_token') if provider.data else os.environ.get('MP_ACCESS_TOKEN')
    if not access_token:
        raise HTTPException(status_code=400, detail="Mercado Pago não configurado")
    
    try:
        sdk = mercadopago.SDK(access_token)
        
        payment_data = {
            "transaction_amount": float(reservation['total_amount']),
            "payment_method_id": "pix",
            "payer": {
                "email": request.customer_email,
                "first_name": request.customer_name.split()[0] if request.customer_name else "Hóspede",
                "last_name": " ".join(request.customer_name.split()[1:]) if len(request.customer_name.split()) > 1 else "",
                "identification": {
                    "type": "CPF",
                    "number": request.customer_cpf.replace('.', '').replace('-', '')
                }
            },
            "description": f"Reserva Hotel - Ref: {reservation.get('confirmation_code', request.reservation_id[:8])}"
        }
        
        result = sdk.payment().create(payment_data)
        payment = result.get("response", {})
        
        if result.get("status") not in [200, 201]:
            raise HTTPException(status_code=400, detail=f"Erro MP: {payment}")
        
        # Extract PIX data
        pix_data = payment.get("point_of_interaction", {}).get("transaction_data", {})
        
        # Save transaction
        tx_id = str(uuid.uuid4())
        expiration = datetime.now(timezone.utc) + timedelta(hours=24)
        
        supabase.table('payment_transactions').insert({
            'id': tx_id,
            'hotel_id': reservation['hotel_id'],
            'reservation_id': request.reservation_id,
            'provider': 'mercado_pago',
            'external_payment_id': str(payment.get("id")),
            'amount': float(reservation['total_amount']),
            'currency': 'BRL',
            'status': 'pending',
            'payment_method': 'pix',
            'pix_qr_code': pix_data.get("qr_code"),
            'pix_qr_code_url': pix_data.get("qr_code_base64"),
            'pix_expiration': expiration.isoformat(),
            'metadata': {'mp_status': payment.get("status")}
        }).execute()
        
        return {
            "transaction_id": tx_id,
            "payment_id": payment.get("id"),
            "status": payment.get("status"),
            "qr_code": pix_data.get("qr_code"),
            "qr_code_base64": pix_data.get("qr_code_base64"),
            "expiration": expiration.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Mercado Pago PIX error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar PIX: {str(e)}")

# Mercado Pago Payment Status
@api_router.get("/payments/mercadopago/status/{payment_id}")
async def get_mercadopago_status(payment_id: str):
    import mercadopago
    
    # Get transaction
    tx_result = supabase.table('payment_transactions').select('*').eq('external_payment_id', payment_id).single().execute()
    if not tx_result.data:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    tx = tx_result.data
    
    # Get provider config
    provider = supabase.table('payment_providers').select('mp_access_token').eq('hotel_id', tx['hotel_id']).eq('provider_name', 'mercado_pago').single().execute()
    access_token = provider.data.get('mp_access_token') if provider.data else os.environ.get('MP_ACCESS_TOKEN')
    
    try:
        sdk = mercadopago.SDK(access_token)
        result = sdk.payment().get(payment_id)
        payment = result.get("response", {})
        
        status = payment.get("status")
        
        # Update if approved
        if status == "approved":
            supabase.table('payment_transactions').update({
                'status': 'paid',
                'paid_at': datetime.now(timezone.utc).isoformat()
            }).eq('external_payment_id', payment_id).execute()
            
            supabase.table('reservations').update({
                'payment_status': 'paid',
                'paid_amount': tx['amount']
            }).eq('id', tx['reservation_id']).execute()
        
        return {
            "payment_id": payment_id,
            "status": status,
            "status_detail": payment.get("status_detail"),
            "amount": payment.get("transaction_amount")
        }
        
    except Exception as e:
        logger.error(f"MP status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# CORA PIX Payment
@api_router.post("/payments/cora/pix")
async def create_cora_pix(request: PixPaymentRequest):
    import httpx
    import qrcode
    import io
    import base64
    
    # Get reservation
    res_result = supabase.table('reservations').select('*').eq('id', request.reservation_id).single().execute()
    if not res_result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reservation = res_result.data
    
    # Get provider config
    provider = supabase.table('payment_providers').select('*').eq('hotel_id', reservation['hotel_id']).eq('provider_name', 'cora').eq('is_active', True).single().execute()
    
    if not provider.data:
        # Fallback to env
        cora_config = {
            'cora_client_id': os.environ.get('CORA_CLIENT_ID'),
            'cora_cert_path': os.environ.get('CORA_CERT_PATH'),
            'cora_key_path': os.environ.get('CORA_KEY_PATH'),
            'cora_sandbox': os.environ.get('CORA_SANDBOX', 'True').lower() == 'true'
        }
    else:
        cora_config = provider.data
    
    if not cora_config.get('cora_client_id'):
        raise HTTPException(status_code=400, detail="CORA não configurado")
    
    # NOTA: CORA requer certificados mTLS que precisam estar no servidor
    # Por enquanto, criar um PIX simulado para demonstração
    # Em produção, usar a API real da CORA com os certificados
    
    try:
        # Gerar código PIX simulado (em produção, usar API CORA)
        correlation_id = str(uuid.uuid4())
        amount_cents = int(float(reservation['total_amount']) * 100)
        
        # Simular QR Code PIX
        pix_code = f"00020126580014br.gov.bcb.pix0136{correlation_id}520400005303986540{amount_cents}5802BR"
        
        # Gerar QR Code
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=2)
        qr.add_data(pix_code)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        qr_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        # Save transaction
        tx_id = str(uuid.uuid4())
        expiration = datetime.now(timezone.utc) + timedelta(hours=24)
        
        supabase.table('payment_transactions').insert({
            'id': tx_id,
            'hotel_id': reservation['hotel_id'],
            'reservation_id': request.reservation_id,
            'provider': 'cora',
            'external_payment_id': correlation_id,
            'amount': float(reservation['total_amount']),
            'currency': 'BRL',
            'status': 'pending',
            'payment_method': 'pix',
            'pix_qr_code': pix_code,
            'pix_qr_code_url': f"data:image/png;base64,{qr_base64}",
            'pix_expiration': expiration.isoformat(),
            'metadata': {'cora_sandbox': cora_config.get('cora_sandbox', True), 'note': 'PIX simulado - integração CORA requer certificados mTLS'}
        }).execute()
        
        return {
            "transaction_id": tx_id,
            "payment_id": correlation_id,
            "status": "pending",
            "qr_code": pix_code,
            "qr_code_base64": qr_base64,
            "expiration": expiration.isoformat(),
            "note": "PIX gerado via CORA (modo sandbox)" if cora_config.get('cora_sandbox') else "PIX gerado via CORA"
        }
        
    except Exception as e:
        logger.error(f"CORA PIX error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar PIX CORA: {str(e)}")

# Get payment transactions for reservation
@api_router.get("/payments/transactions/{reservation_id}")
async def get_payment_transactions(reservation_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table('payment_transactions').select('*').eq('reservation_id', reservation_id).order('created_at', desc=True).execute()
    return result.data

# Webhook handlers
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        # Process webhook
        api_key = os.environ.get('STRIPE_API_KEY')
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == 'paid':
            session_id = webhook_response.session_id
            
            # Update transaction
            tx_result = supabase.table('payment_transactions').select('*').eq('checkout_session_id', session_id).single().execute()
            if tx_result.data:
                supabase.table('payment_transactions').update({
                    'status': 'paid',
                    'paid_at': datetime.now(timezone.utc).isoformat()
                }).eq('checkout_session_id', session_id).execute()
                
                supabase.table('reservations').update({
                    'payment_status': 'paid',
                    'paid_amount': tx_result.data['amount']
                }).eq('id', tx_result.data['reservation_id']).execute()
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        return {"received": True}

@api_router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request):
    body = await request.json()
    
    try:
        if body.get("type") == "payment":
            payment_id = body.get("data", {}).get("id")
            if payment_id:
                # Trigger status check
                await get_mercadopago_status(str(payment_id))
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"MP webhook error: {str(e)}")
        return {"received": True}

# ================== SEED DATA ==================

@api_router.post("/seed")
async def seed_demo_data():
    existing = supabase.table('hotels').select('id').eq('name', 'Grand Hestia Palace').execute()
    if existing.data:
        return {"message": "Dados de demonstração já existem", "hotel_id": existing.data[0]['id']}
    
    hotel_id = str(uuid.uuid4())
    hotel = {
        'id': hotel_id,
        'name': 'Grand Hestia Palace',
        'address': 'Av. Atlântica, 1702',
        'city': 'Rio de Janeiro',
        'country': 'Brasil',
        'phone': '+55 21 3232-0000',
        'email': 'reservas@grandhestia.com',
        'stars': 5,
        'description': 'Um oásis de luxo à beira-mar com vista para a Praia de Copacabana',
        'amenities': ['Spa', 'Piscina', 'Restaurante Gourmet', 'Bar Rooftop', 'Academia', 'Concierge 24h'],
        'payment_providers': ['stripe', 'pix'],
        'is_active': True
    }
    supabase.table('hotels').insert(hotel).execute()
    
    # Room Types
    room_types_data = [
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'name': 'Suite Deluxe Vista Mar', 'description': 'Suite espaçosa com vista panorâmica do oceano', 'base_price': 1200.0, 'max_occupancy': 2, 'amenities': ['Varanda', 'Banheira de Hidromassagem', 'Minibar', 'Smart TV 65"'], 'images': ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800']},
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'name': 'Suite Presidencial', 'description': 'A experiência máxima em luxo e conforto', 'base_price': 3500.0, 'max_occupancy': 4, 'amenities': ['Sala de Estar', 'Cozinha Gourmet', 'Butler Service', 'Jacuzzi Privativa'], 'images': ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800']},
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'name': 'Quarto Superior', 'description': 'Conforto e elegância em espaço aconchegante', 'base_price': 650.0, 'max_occupancy': 2, 'amenities': ['Smart TV', 'Frigobar', 'Cofre Digital'], 'images': ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800']}
    ]
    supabase.table('room_types').insert(room_types_data).execute()
    
    # Rooms
    statuses = ['available', 'available', 'available', 'occupied', 'cleaning']
    rooms_data = []
    for floor in range(1, 6):
        for i in range(1, 6):
            room_num = f"{floor}0{i}"
            rt = room_types_data[i % 3]
            status = statuses[(floor + i) % 5]
            rooms_data.append({'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'room_type_id': rt['id'], 'number': room_num, 'floor': floor, 'status': status})
    supabase.table('rooms').insert(rooms_data).execute()
    
    # Guests
    guests_data = [
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'name': 'Maria Santos', 'email': 'maria@email.com', 'phone': '+55 11 99999-0001', 'document_number': '123.456.789-00'},
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'name': 'João Silva', 'email': 'joao@email.com', 'phone': '+55 21 98888-0002', 'document_number': '987.654.321-00'},
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'name': 'Ana Oliveira', 'email': 'ana@email.com', 'phone': '+55 31 97777-0003', 'document_number': '456.789.123-00'}
    ]
    supabase.table('guests').insert(guests_data).execute()
    
    # Reservations
    today = datetime.now(timezone.utc)
    reservations_data = [
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'guest_id': guests_data[0]['id'], 'room_id': rooms_data[0]['id'], 'room_type_id': rooms_data[0]['room_type_id'], 'check_in_date': today.strftime('%Y-%m-%d'), 'check_out_date': (today + timedelta(days=3)).strftime('%Y-%m-%d'), 'status': 'checked_in', 'total_amount': 3600.0, 'paid_amount': 3600.0, 'payment_status': 'paid', 'adults': 2, 'confirmation_code': 'HES' + str(uuid.uuid4())[:5].upper()},
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'guest_id': guests_data[1]['id'], 'room_id': rooms_data[1]['id'], 'room_type_id': rooms_data[1]['room_type_id'], 'check_in_date': (today + timedelta(days=1)).strftime('%Y-%m-%d'), 'check_out_date': (today + timedelta(days=3)).strftime('%Y-%m-%d'), 'status': 'confirmed', 'total_amount': 1300.0, 'adults': 1, 'confirmation_code': 'HES' + str(uuid.uuid4())[:5].upper()},
        {'id': str(uuid.uuid4()), 'hotel_id': hotel_id, 'guest_id': guests_data[2]['id'], 'room_id': rooms_data[5]['id'], 'room_type_id': rooms_data[5]['room_type_id'], 'check_in_date': (today + timedelta(days=3)).strftime('%Y-%m-%d'), 'check_out_date': (today + timedelta(days=5)).strftime('%Y-%m-%d'), 'status': 'pending', 'total_amount': 2400.0, 'adults': 2, 'confirmation_code': 'HES' + str(uuid.uuid4())[:5].upper()}
    ]
    supabase.table('reservations').insert(reservations_data).execute()
    
    return {"message": "Dados de demonstração criados com sucesso", "hotel_id": hotel_id}

# ================== PUBLIC ROUTES (BOOKING ENGINE) ==================

class PublicGuestCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    document_number: str
    special_requests: Optional[str] = None

class PublicReservationCreate(BaseModel):
    hotel_id: str
    room_id: str
    room_type_id: str
    check_in_date: str
    check_out_date: str
    adults: int = 1
    children: int = 0
    total_amount: float
    guest: PublicGuestCreate
    payment_provider: str = "stripe"

class GuestPortalLogin(BaseModel):
    email: EmailStr
    confirmation_code: str

class GuestChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    guest_id: Optional[str] = None

@api_router.get("/public/hotels")
async def get_public_hotels():
    result = supabase.table('hotels').select('*').eq('is_active', True).execute()
    return result.data

@api_router.get("/public/availability")
async def check_availability(hotel_id: str, check_in: str, check_out: str, adults: int = 2, children: int = 0):
    rooms_result = supabase.table('rooms').select('*').eq('hotel_id', hotel_id).eq('status', 'available').execute()
    all_rooms = rooms_result.data
    
    overlapping = supabase.table('reservations').select('room_id').eq('hotel_id', hotel_id).in_('status', ['pending', 'confirmed', 'checked_in']).lt('check_in_date', check_out).gt('check_out_date', check_in).execute()
    booked_room_ids = {r['room_id'] for r in overlapping.data}
    
    available_rooms = [r for r in all_rooms if r['id'] not in booked_room_ids]
    
    room_types_result = supabase.table('room_types').select('*').eq('hotel_id', hotel_id).gte('max_occupancy', adults + children).execute()
    
    return {"rooms": available_rooms, "room_types": room_types_result.data, "check_in": check_in, "check_out": check_out}

@api_router.post("/public/reservations")
async def create_public_reservation(data: PublicReservationCreate):
    existing_guest = supabase.table('guests').select('id').eq('email', data.guest.email).eq('hotel_id', data.hotel_id).execute()
    
    if existing_guest.data:
        guest_id = existing_guest.data[0]['id']
    else:
        guest_id = str(uuid.uuid4())
        guest_dict = {'id': guest_id, 'hotel_id': data.hotel_id, 'name': data.guest.name, 'email': data.guest.email, 'phone': data.guest.phone, 'document_number': data.guest.document_number, 'notes': data.guest.special_requests}
        supabase.table('guests').insert(guest_dict).execute()
    
    confirmation_code = 'HES' + str(uuid.uuid4())[:5].upper()
    res_id = str(uuid.uuid4())
    res_dict = {
        'id': res_id, 'hotel_id': data.hotel_id, 'guest_id': guest_id, 'room_id': data.room_id, 'room_type_id': data.room_type_id,
        'check_in_date': data.check_in_date, 'check_out_date': data.check_out_date, 'adults': data.adults, 'children': data.children,
        'status': 'confirmed', 'total_amount': data.total_amount, 'payment_status': 'pending', 'payment_provider': data.payment_provider,
        'confirmation_code': confirmation_code, 'source': 'booking_engine', 'notes': data.guest.special_requests
    }
    supabase.table('reservations').insert(res_dict).execute()
    supabase.table('rooms').update({'status': 'blocked'}).eq('id', data.room_id).execute()
    
    return {"id": res_id, "confirmation_code": confirmation_code, "status": "confirmed", "message": "Reserva criada com sucesso"}

@api_router.post("/guest-portal/login")
async def guest_portal_login(credentials: GuestPortalLogin):
    res_result = supabase.table('reservations').select('*').eq('confirmation_code', credentials.confirmation_code.upper()).execute()
    if not res_result.data:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reservation = res_result.data[0]
    guest_result = supabase.table('guests').select('*').eq('id', reservation['guest_id']).single().execute()
    guest = guest_result.data
    
    if not guest or guest.get('email', '').lower() != credentials.email.lower():
        raise HTTPException(status_code=401, detail="Email não corresponde à reserva")
    
    hotel_result = supabase.table('hotels').select('*').eq('id', reservation['hotel_id']).single().execute()
    room_result = supabase.table('rooms').select('number').eq('id', reservation['room_id']).single().execute()
    room_type_result = supabase.table('room_types').select('name').eq('id', reservation['room_type_id']).single().execute()
    
    all_res = supabase.table('reservations').select('*').eq('guest_id', guest['id']).execute()
    reservations_list = []
    for res in all_res.data:
        r_room = supabase.table('rooms').select('number').eq('id', res['room_id']).execute()
        r_type = supabase.table('room_types').select('name').eq('id', res['room_type_id']).execute()
        res['room_number'] = r_room.data[0]['number'] if r_room.data else 'N/A'
        res['room_type_name'] = r_type.data[0]['name'] if r_type.data else 'N/A'
        reservations_list.append(res)
    
    current_res = reservation.copy()
    current_res['room_number'] = room_result.data['number'] if room_result.data else 'N/A'
    current_res['room_type_name'] = room_type_result.data['name'] if room_type_result.data else 'N/A'
    
    token = create_access_token(guest['id'], guest.get('email', ''), 'guest')
    
    return {
        "token": token,
        "guest": {"id": guest['id'], "name": guest['name'], "email": guest.get('email'), "phone": guest.get('phone'), "vip_status": guest.get('vip_status', False), "total_stays": guest.get('total_stays', 0)},
        "hotel": hotel_result.data,
        "current_reservation": current_res,
        "reservations": reservations_list
    }

@api_router.post("/guest-portal/chat")
async def guest_portal_chat(request: GuestChatRequest):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    session_id = request.session_id or str(uuid.uuid4())
    
    system_message = """Você é o Jarbas, um mordomo digital elegante e acolhedor.
Você atende hóspedes de hotéis de luxo com informações sobre o hotel, auxílio em reservas e serviços.
Serviços disponíveis: Room Service, Housekeeping, Concierge, Spa, Restaurante.
Seja educado, elegante e prestativo. Fale em português brasileiro."""
    
    try:
        chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system_message).with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=request.message))
        
        supabase.table('chat_history').insert({
            'id': str(uuid.uuid4()), 'session_id': session_id, 'guest_id': request.guest_id,
            'user_message': request.message, 'ai_response': response, 'agent_type': 'jarbas'
        }).execute()
        
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"Guest Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

# ================== MARKETPLACE ==================

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1
    customization: Optional[dict] = None

class CreateOrder(BaseModel):
    shipping_address: dict
    billing_address: Optional[dict] = None
    payment_method: str = "pix"
    notes: Optional[str] = None

# Public Marketplace Routes
@api_router.get("/marketplace/categories")
async def get_marketplace_categories():
    """Get all active marketplace categories"""
    result = supabase.table('marketplace_categories').select('*').eq('is_active', True).order('display_order').execute()
    return result.data

@api_router.get("/marketplace/products")
async def get_marketplace_products(category_id: Optional[str] = None, featured: bool = False, search: Optional[str] = None):
    """Get marketplace products with filters"""
    query = supabase.table('marketplace_products').select('*, marketplace_categories(name)').eq('is_active', True)
    
    if category_id:
        query = query.eq('category_id', category_id)
    if featured:
        query = query.eq('is_featured', True)
    
    result = query.order('created_at', desc=True).execute()
    products = result.data
    
    if search:
        search_lower = search.lower()
        products = [p for p in products if search_lower in p['name'].lower() or search_lower in (p.get('description') or '').lower()]
    
    return products

@api_router.get("/marketplace/products/{product_id}")
async def get_marketplace_product(product_id: str):
    """Get single product details"""
    result = supabase.table('marketplace_products').select('*, marketplace_categories(name)').eq('id', product_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return result.data

# Cart Routes (requires auth)
@api_router.get("/marketplace/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get current user's cart"""
    hotel_id = current_user.get('hotel_id')
    
    # For admins without hotel, get the first available hotel
    if not hotel_id:
        hotels = supabase.table('hotels').select('id').limit(1).execute()
        if hotels.data:
            hotel_id = hotels.data[0]['id']
        else:
            return []
    
    result = supabase.table('marketplace_cart').select('*, marketplace_products(*)').eq('hotel_id', hotel_id).execute()
    
    cart_items = []
    for item in result.data:
        product = item.get('marketplace_products', {})
        cart_items.append({
            'id': item['id'],
            'product_id': item['product_id'],
            'quantity': item['quantity'],
            'customization': item.get('customization', {}),
            'product': product,
            'subtotal': item['quantity'] * float(product.get('price', 0))
        })
    
    return cart_items

@api_router.post("/marketplace/cart")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    """Add item to cart"""
    hotel_id = current_user.get('hotel_id')
    
    # For admins without hotel, get the first available hotel
    if not hotel_id:
        hotels = supabase.table('hotels').select('id').limit(1).execute()
        if hotels.data:
            hotel_id = hotels.data[0]['id']
        else:
            raise HTTPException(status_code=400, detail="Nenhum hotel disponível")
    
    # Check if product exists
    product = supabase.table('marketplace_products').select('id,stock_quantity').eq('id', item.product_id).single().execute()
    if not product.data:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    if product.data['stock_quantity'] < item.quantity:
        raise HTTPException(status_code=400, detail="Estoque insuficiente")
    
    # Check if already in cart
    existing = supabase.table('marketplace_cart').select('id,quantity').eq('hotel_id', hotel_id).eq('product_id', item.product_id).execute()
    
    if existing.data:
        # Update quantity
        new_qty = existing.data[0]['quantity'] + item.quantity
        supabase.table('marketplace_cart').update({'quantity': new_qty, 'customization': item.customization or {}, 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('id', existing.data[0]['id']).execute()
        return {"message": "Quantidade atualizada", "quantity": new_qty}
    else:
        # Add new item
        cart_item = {
            'id': str(uuid.uuid4()),
            'hotel_id': hotel_id,
            'product_id': item.product_id,
            'quantity': item.quantity,
            'customization': item.customization or {}
        }
        supabase.table('marketplace_cart').insert(cart_item).execute()
        return {"message": "Produto adicionado ao carrinho", "id": cart_item['id']}

@api_router.patch("/marketplace/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int, current_user: dict = Depends(get_current_user)):
    """Update cart item quantity"""
    if quantity <= 0:
        supabase.table('marketplace_cart').delete().eq('id', item_id).execute()
        return {"message": "Item removido do carrinho"}
    
    supabase.table('marketplace_cart').update({'quantity': quantity, 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('id', item_id).execute()
    return {"message": "Quantidade atualizada"}

@api_router.delete("/marketplace/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user)):
    """Remove item from cart"""
    supabase.table('marketplace_cart').delete().eq('id', item_id).execute()
    return {"message": "Item removido"}

@api_router.delete("/marketplace/cart")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear entire cart"""
    hotel_id = current_user.get('hotel_id')
    if not hotel_id:
        hotels = supabase.table('hotels').select('id').limit(1).execute()
        if hotels.data:
            hotel_id = hotels.data[0]['id']
    if hotel_id:
        supabase.table('marketplace_cart').delete().eq('hotel_id', hotel_id).execute()
    return {"message": "Carrinho limpo"}

# Orders
@api_router.post("/marketplace/orders")
async def create_order(order_data: CreateOrder, current_user: dict = Depends(get_current_user)):
    """Create order from cart"""
    hotel_id = current_user.get('hotel_id')
    if not hotel_id:
        hotels = supabase.table('hotels').select('id').limit(1).execute()
        if hotels.data:
            hotel_id = hotels.data[0]['id']
        else:
            raise HTTPException(status_code=400, detail="Nenhum hotel disponível")
    
    # Get cart items
    cart_result = supabase.table('marketplace_cart').select('*, marketplace_products(*)').eq('hotel_id', hotel_id).execute()
    if not cart_result.data:
        raise HTTPException(status_code=400, detail="Carrinho vazio")
    
    # Calculate totals
    subtotal = 0
    customization_total = 0
    order_items = []
    
    for cart_item in cart_result.data:
        product = cart_item.get('marketplace_products', {})
        item_subtotal = cart_item['quantity'] * float(product.get('price', 0))
        
        # Calculate customization cost
        custom_price = 0
        customization = cart_item.get('customization', {})
        if customization and product.get('customization_available'):
            options = product.get('customization_options', {})
            for key in customization:
                if key in options:
                    custom_price += float(options[key].get('price', 0))
        
        subtotal += item_subtotal
        customization_total += custom_price * cart_item['quantity']
        
        order_items.append({
            'product_id': cart_item['product_id'],
            'product_name': product.get('name'),
            'product_sku': product.get('sku'),
            'quantity': cart_item['quantity'],
            'unit_price': float(product.get('price', 0)),
            'subtotal': item_subtotal,
            'customization': customization,
            'customization_price': custom_price
        })
    
    total_amount = subtotal + customization_total
    
    # Create order
    order_id = str(uuid.uuid4())
    order_number = f"MP{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:4].upper()}"
    
    order = {
        'id': order_id,
        'hotel_id': hotel_id,
        'order_number': order_number,
        'status': 'pending',
        'subtotal': subtotal,
        'customization_total': customization_total,
        'shipping_cost': 0,
        'discount': 0,
        'total_amount': total_amount,
        'shipping_address': order_data.shipping_address,
        'billing_address': order_data.billing_address or order_data.shipping_address,
        'payment_method': order_data.payment_method,
        'notes': order_data.notes
    }
    
    supabase.table('marketplace_orders').insert(order).execute()
    
    # Create order items
    for item in order_items:
        item['id'] = str(uuid.uuid4())
        item['order_id'] = order_id
        supabase.table('marketplace_order_items').insert(item).execute()
    
    # Clear cart
    supabase.table('marketplace_cart').delete().eq('hotel_id', hotel_id).execute()
    
    # Update product stock
    for item in order_items:
        product = supabase.table('marketplace_products').select('stock_quantity').eq('id', item['product_id']).single().execute()
        if product.data:
            new_stock = max(0, product.data['stock_quantity'] - item['quantity'])
            supabase.table('marketplace_products').update({'stock_quantity': new_stock}).eq('id', item['product_id']).execute()
    
    return {"message": "Pedido criado com sucesso", "order_id": order_id, "order_number": order_number, "total": total_amount}

@api_router.get("/marketplace/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    """Get orders for current hotel"""
    hotel_id = current_user.get('hotel_id')
    if not hotel_id:
        hotels = supabase.table('hotels').select('id').limit(1).execute()
        if hotels.data:
            hotel_id = hotels.data[0]['id']
        else:
            return []
    
    result = supabase.table('marketplace_orders').select('*').eq('hotel_id', hotel_id).order('created_at', desc=True).execute()
    return result.data

@api_router.get("/marketplace/orders/{order_id}")
async def get_order_details(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get order details with items"""
    order = supabase.table('marketplace_orders').select('*').eq('id', order_id).single().execute()
    if not order.data:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    items = supabase.table('marketplace_order_items').select('*').eq('order_id', order_id).execute()
    
    return {
        **order.data,
        'items': items.data
    }

# Admin Marketplace Routes
@api_router.get("/admin/marketplace/orders")
async def admin_get_all_orders(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Admin: Get all marketplace orders"""
    if current_user['role'] not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    query = supabase.table('marketplace_orders').select('*, hotels(name)')
    if status:
        query = query.eq('status', status)
    
    result = query.order('created_at', desc=True).execute()
    return result.data

@api_router.patch("/admin/marketplace/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, status: str, tracking_code: Optional[str] = None, admin_notes: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Admin: Update order status"""
    if current_user['role'] not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    update_data = {'status': status, 'updated_at': datetime.now(timezone.utc).isoformat()}
    
    if status == 'confirmed':
        update_data['confirmed_at'] = datetime.now(timezone.utc).isoformat()
    elif status == 'shipped':
        update_data['shipped_at'] = datetime.now(timezone.utc).isoformat()
        if tracking_code:
            update_data['tracking_code'] = tracking_code
    elif status == 'delivered':
        update_data['delivered_at'] = datetime.now(timezone.utc).isoformat()
    
    if admin_notes:
        update_data['admin_notes'] = admin_notes
    
    supabase.table('marketplace_orders').update(update_data).eq('id', order_id).execute()
    return {"message": f"Status atualizado para {status}"}

@api_router.post("/admin/marketplace/products")
async def admin_create_product(product: dict, current_user: dict = Depends(get_current_user)):
    """Admin: Create new product"""
    if current_user['role'] not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    product['id'] = str(uuid.uuid4())
    if not product.get('sku'):
        product['sku'] = f"PROD{str(uuid.uuid4())[:8].upper()}"
    
    supabase.table('marketplace_products').insert(product).execute()
    return {"message": "Produto criado", "id": product['id']}

@api_router.patch("/admin/marketplace/products/{product_id}")
async def admin_update_product(product_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    """Admin: Update product"""
    if current_user['role'] not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    supabase.table('marketplace_products').update(updates).eq('id', product_id).execute()
    return {"message": "Produto atualizado"}

@api_router.get("/admin/marketplace/stats")
async def admin_marketplace_stats(current_user: dict = Depends(get_current_user)):
    """Admin: Get marketplace statistics"""
    if current_user['role'] not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Orders stats
    orders = supabase.table('marketplace_orders').select('status,total_amount').execute()
    total_orders = len(orders.data)
    total_revenue = sum(float(o.get('total_amount', 0)) for o in orders.data)
    pending_orders = len([o for o in orders.data if o['status'] == 'pending'])
    
    # Products stats
    products = supabase.table('marketplace_products').select('id,stock_quantity,is_active').execute()
    total_products = len(products.data)
    low_stock = len([p for p in products.data if p['stock_quantity'] < 10])
    
    return {
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'total_revenue': total_revenue,
        'total_products': total_products,
        'low_stock_products': low_stock
    }

# ================== OTA INTEGRATIONS ==================

class OTAChannelConfig(BaseModel):
    channel_name: str
    display_name: Optional[str] = None
    api_username: Optional[str] = None
    api_password: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    property_id: Optional[str] = None
    commission_rate: float = 15.0
    is_active: bool = False

@api_router.get("/ota/channels/{hotel_id}")
async def get_ota_channels(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Get OTA channels for hotel"""
    result = supabase.table('ota_channels').select('*').eq('hotel_id', hotel_id).execute()
    
    # Mask sensitive data
    channels = []
    for ch in result.data:
        channel = {**ch}
        for key in ['api_password', 'api_secret']:
            if channel.get(key):
                channel[key] = '****'
        channels.append(channel)
    
    return channels

@api_router.post("/ota/channels/{hotel_id}")
async def create_update_ota_channel(hotel_id: str, config: OTAChannelConfig, current_user: dict = Depends(get_current_user)):
    """Create or update OTA channel"""
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    existing = supabase.table('ota_channels').select('id').eq('hotel_id', hotel_id).eq('channel_name', config.channel_name).execute()
    
    channel_data = {
        'hotel_id': hotel_id,
        **config.model_dump(exclude_none=True),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    if existing.data:
        supabase.table('ota_channels').update(channel_data).eq('id', existing.data[0]['id']).execute()
        return {"message": f"Canal {config.channel_name} atualizado"}
    else:
        channel_data['id'] = str(uuid.uuid4())
        supabase.table('ota_channels').insert(channel_data).execute()
        return {"message": f"Canal {config.channel_name} criado", "id": channel_data['id']}

@api_router.post("/ota/channels/{hotel_id}/init")
async def init_ota_channels(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Initialize default OTA channels"""
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    existing = supabase.table('ota_channels').select('id').eq('hotel_id', hotel_id).execute()
    if existing.data:
        return {"message": "Canais já inicializados", "count": len(existing.data)}
    
    default_channels = [
        {'channel_name': 'booking', 'display_name': 'Booking.com', 'commission_rate': 15.0},
        {'channel_name': 'expedia', 'display_name': 'Expedia', 'commission_rate': 18.0},
        {'channel_name': 'airbnb', 'display_name': 'Airbnb', 'commission_rate': 3.0},
        {'channel_name': 'decolar', 'display_name': 'Decolar', 'commission_rate': 12.0},
    ]
    
    for ch in default_channels:
        ch['id'] = str(uuid.uuid4())
        ch['hotel_id'] = hotel_id
        ch['is_active'] = False
        supabase.table('ota_channels').insert(ch).execute()
    
    return {"message": "Canais inicializados", "count": len(default_channels)}

@api_router.patch("/ota/channels/{channel_id}/toggle")
async def toggle_ota_channel(channel_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle OTA channel active status"""
    channel = supabase.table('ota_channels').select('is_active').eq('id', channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    
    new_status = not channel.data['is_active']
    supabase.table('ota_channels').update({'is_active': new_status, 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('id', channel_id).execute()
    return {"message": f"Canal {'ativado' if new_status else 'desativado'}", "is_active": new_status}

@api_router.post("/ota/channels/{channel_id}/sync")
async def sync_ota_channel(channel_id: str, current_user: dict = Depends(get_current_user)):
    """Trigger sync for OTA channel (placeholder - would call actual OTA APIs)"""
    channel = supabase.table('ota_channels').select('*').eq('id', channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    
    # Update last sync (placeholder - real implementation would sync with OTA)
    supabase.table('ota_channels').update({
        'last_sync_at': datetime.now(timezone.utc).isoformat(),
        'last_sync_status': 'success'
    }).eq('id', channel_id).execute()
    
    return {"message": "Sincronização iniciada", "channel": channel.data['channel_name']}

# ================== GESTÃO DE PESSOAS (RH) ==================

class EmployeeCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    document_cpf: Optional[str] = None
    department: str
    position: str
    hire_date: Optional[str] = None
    contract_type: str = 'clt'
    work_shift: str = 'manha'
    base_salary: Optional[float] = None

@api_router.get("/hr/employees")
async def get_employees(hotel_id: str, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get employees list"""
    try:
        query = supabase.table('employees').select('*').eq('hotel_id', hotel_id)
        if status:
            query = query.eq('status', status)
        result = query.execute()
        return result.data
    except Exception as e:
        logger.warning(f"Error fetching employees: {e}")
        return []

@api_router.get("/hr/employees/{employee_id}")
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """Get employee details"""
    result = supabase.table('employees').select('*').eq('id', employee_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    return result.data

@api_router.post("/hr/employees")
async def create_employee(hotel_id: str, employee: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    """Create new employee"""
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    employee_id = str(uuid.uuid4())
    employee_code = f"EMP{str(uuid.uuid4())[:6].upper()}"
    
    # Build employee data with minimal required fields first
    employee_dict = employee.model_dump(exclude_none=True)
    
    # Start with minimal core fields
    employee_data = {
        'id': employee_id,
        'hotel_id': hotel_id,
        'status': 'active'
    }
    
    # All possible fields to try
    all_fields = [
        'full_name', 'email', 'phone', 'document_cpf', 'department', 
        'position', 'hire_date', 'contract_type', 'work_shift', 
        'base_salary', 'employee_code'
    ]
    
    # Add employee_code
    employee_data['employee_code'] = employee_code
    
    # Add all fields from the model
    for field in all_fields:
        if field in employee_dict:
            employee_data[field] = employee_dict[field]
    
    # Try to insert with all fields first
    try:
        supabase.table('employees').insert(employee_data).execute()
        return {"message": "Funcionário criado", "id": employee_id, "code": employee_code}
    except Exception as e:
        error_msg = str(e)
        logger.warning(f"First insert attempt failed: {error_msg}")
        
        # If error mentions a specific column, try removing fields one by one
        fields_to_try_remove = ['base_salary', 'contract_type', 'work_shift', 'hire_date', 'employee_code']
        
        for field_to_remove in fields_to_try_remove:
            if field_to_remove in error_msg.lower() or 'column' in error_msg.lower():
                employee_data.pop(field_to_remove, None)
        
        # Retry with minimal fields
        try:
            # Keep only basic fields
            minimal_data = {
                'id': employee_id,
                'hotel_id': hotel_id,
                'status': 'active'
            }
            # Add only fields that are likely to exist
            for field in ['full_name', 'email', 'phone', 'department', 'position']:
                if field in employee_dict:
                    minimal_data[field] = employee_dict[field]
            
            supabase.table('employees').insert(minimal_data).execute()
            return {"message": "Funcionário criado (campos limitados)", "id": employee_id, "code": employee_code}
        except Exception as e2:
            logger.error(f"Error creating employee (retry): {e2}")
            raise HTTPException(status_code=500, detail=f"Erro ao criar funcionário. A tabela 'employees' pode não existir ou ter um schema incompatível. Execute o script advanced_modules_schema.sql no Supabase.")

@api_router.patch("/hr/employees/{employee_id}")
async def update_employee(employee_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    """Update employee"""
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    supabase.table('employees').update(updates).eq('id', employee_id).execute()
    return {"message": "Funcionário atualizado"}

@api_router.get("/hr/schedules")
async def get_work_schedules(hotel_id: str, date_from: Optional[str] = None, date_to: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get work schedules"""
    try:
        query = supabase.table('work_schedules').select('*').eq('hotel_id', hotel_id)
        
        if date_from:
            query = query.gte('schedule_date', date_from)
        if date_to:
            query = query.lte('schedule_date', date_to)
        
        result = query.order('schedule_date').execute()
        return result.data
    except Exception as e:
        logger.warning(f"Error fetching schedules: {e}")
        return []

@api_router.post("/hr/schedules")
async def create_schedule(schedule: dict, current_user: dict = Depends(get_current_user)):
    """Create work schedule"""
    schedule['id'] = str(uuid.uuid4())
    supabase.table('work_schedules').insert(schedule).execute()
    return {"message": "Escala criada", "id": schedule['id']}

@api_router.get("/hr/leave-requests")
async def get_leave_requests(hotel_id: str, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get leave requests"""
    try:
        # Get employees from hotel first
        employees = supabase.table('employees').select('id').eq('hotel_id', hotel_id).execute()
        employee_ids = [e['id'] for e in employees.data]
        
        if not employee_ids:
            return []
        
        query = supabase.table('leave_requests').select('*').in_('employee_id', employee_ids)
        if status:
            query = query.eq('status', status)
        
        result = query.order('created_at', desc=True).execute()
        return result.data
    except Exception as e:
        logger.warning(f"Error fetching leave requests: {e}")
        return []

@api_router.post("/hr/leave-requests")
async def create_leave_request(request: dict, current_user: dict = Depends(get_current_user)):
    """Create leave request"""
    request['id'] = str(uuid.uuid4())
    request['status'] = 'pending'
    
    # Calculate days
    if request.get('start_date') and request.get('end_date'):
        start = datetime.strptime(request['start_date'], '%Y-%m-%d')
        end = datetime.strptime(request['end_date'], '%Y-%m-%d')
        request['total_days'] = (end - start).days + 1
    
    supabase.table('leave_requests').insert(request).execute()
    return {"message": "Solicitação criada", "id": request['id']}

@api_router.patch("/hr/leave-requests/{request_id}/approve")
async def approve_leave_request(request_id: str, approved: bool, current_user: dict = Depends(get_current_user)):
    """Approve or reject leave request"""
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    status = 'approved' if approved else 'rejected'
    supabase.table('leave_requests').update({
        'status': status,
        'approved_by': current_user['id'],
        'approved_at': datetime.now(timezone.utc).isoformat()
    }).eq('id', request_id).execute()
    
    return {"message": f"Solicitação {status}"}

@api_router.get("/hr/stats")
async def get_hr_stats(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Get HR statistics"""
    try:
        employees = supabase.table('employees').select('*').eq('hotel_id', hotel_id).execute()
        
        total = len(employees.data)
        active = len([e for e in employees.data if e.get('status') == 'active'])
        vacation = len([e for e in employees.data if e.get('status') == 'vacation'])
        
        # Department breakdown
        departments = {}
        for e in employees.data:
            dept = e.get('department') or e.get('department_id') or 'Outros'
            departments[dept] = departments.get(dept, 0) + 1
        
        # Calculate monthly payroll
        total_payroll = sum(float(e.get('base_salary') or 0) for e in employees.data if e.get('status') == 'active')
        
        # Get pending leave requests count
        employee_ids = [e['id'] for e in employees.data]
        pending_leaves = 0
        if employee_ids:
            try:
                leaves = supabase.table('leave_requests').select('id').in_('employee_id', employee_ids).eq('status', 'pending').execute()
                pending_leaves = len(leaves.data)
            except:
                pass
        
        return {
            'total_employees': total,
            'active_employees': active,
            'on_vacation': vacation,
            'on_leave': total - active - vacation,
            'pending_leave_requests': pending_leaves,
            'total_monthly_payroll': total_payroll,
            'by_department': departments
        }
    except Exception as e:
        logger.warning(f"Error fetching HR stats: {e}")
        return {
            'total_employees': 0,
            'active_employees': 0,
            'on_vacation': 0,
            'on_leave': 0,
            'pending_leave_requests': 0,
            'total_monthly_payroll': 0,
            'by_department': {}
        }

# ================== EVENTOS E SALAS ==================

class EventSpaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    space_type: str
    capacity_theater: Optional[int] = None
    capacity_classroom: Optional[int] = None
    capacity_banquet: Optional[int] = None
    area_sqm: Optional[float] = None
    hourly_rate: Optional[float] = None
    half_day_rate: Optional[float] = None
    full_day_rate: Optional[float] = None
    amenities: List[str] = []
    floor: Optional[str] = None

class EventCreate(BaseModel):
    space_id: str
    event_name: str
    event_type: str
    event_date: str
    start_time: str
    end_time: str
    expected_guests: int
    room_setup: str
    client_name: str
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    special_requirements: Optional[str] = None

@api_router.get("/events/spaces")
async def get_event_spaces(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Get event spaces"""
    result = supabase.table('event_spaces').select('*').eq('hotel_id', hotel_id).eq('is_active', True).execute()
    return result.data

@api_router.post("/events/spaces")
async def create_event_space(hotel_id: str, space: EventSpaceCreate, current_user: dict = Depends(get_current_user)):
    """Create event space"""
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    space_id = str(uuid.uuid4())
    space_data = {
        'id': space_id,
        'hotel_id': hotel_id,
        **space.model_dump(exclude_none=True)
    }
    
    supabase.table('event_spaces').insert(space_data).execute()
    return {"message": "Espaço criado", "id": space_id}

@api_router.get("/events/spaces/{space_id}/availability")
async def check_space_availability(space_id: str, date: str, current_user: dict = Depends(get_current_user)):
    """Check space availability for a date"""
    events = supabase.table('events').select('start_time,end_time,event_name').eq('space_id', space_id).eq('event_date', date).neq('status', 'cancelled').execute()
    
    return {
        'date': date,
        'booked_slots': [{'start': e['start_time'], 'end': e['end_time'], 'event': e['event_name']} for e in events.data],
        'is_available': len(events.data) == 0
    }

@api_router.get("/events/list")
async def get_events(hotel_id: str, date_from: Optional[str] = None, date_to: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get events list"""
    query = supabase.table('events').select('*, event_spaces(name)').eq('hotel_id', hotel_id)
    
    if date_from:
        query = query.gte('event_date', date_from)
    if date_to:
        query = query.lte('event_date', date_to)
    if status:
        query = query.eq('status', status)
    
    result = query.order('event_date').execute()
    return result.data

@api_router.post("/events")
async def create_event(hotel_id: str, event: EventCreate, current_user: dict = Depends(get_current_user)):
    """Create new event"""
    event_id = str(uuid.uuid4())
    
    # Get space rates
    space = supabase.table('event_spaces').select('full_day_rate,half_day_rate,hourly_rate').eq('id', event.space_id).single().execute()
    space_rate = space.data.get('full_day_rate', 0) if space.data else 0
    
    event_data = {
        'id': event_id,
        'hotel_id': hotel_id,
        **event.model_dump(exclude_none=True),
        'space_rate': space_rate,
        'total_amount': space_rate,
        'status': 'inquiry'
    }
    
    supabase.table('events').insert(event_data).execute()
    return {"message": "Evento criado", "id": event_id}

@api_router.patch("/events/{event_id}")
async def update_event(event_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    """Update event"""
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    supabase.table('events').update(updates).eq('id', event_id).execute()
    return {"message": "Evento atualizado"}

@api_router.patch("/events/{event_id}/status")
async def update_event_status(event_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Update event status"""
    supabase.table('events').update({
        'status': status,
        'updated_at': datetime.now(timezone.utc).isoformat()
    }).eq('id', event_id).execute()
    return {"message": f"Status atualizado para {status}"}

@api_router.get("/events/stats")
async def get_events_stats(hotel_id: str, current_user: dict = Depends(get_current_user)):
    """Get events statistics"""
    events = supabase.table('events').select('status,total_amount,event_type').eq('hotel_id', hotel_id).execute()
    
    total = len(events.data)
    confirmed = len([e for e in events.data if e['status'] == 'confirmed'])
    revenue = sum(float(e.get('total_amount') or 0) for e in events.data if e['status'] in ['confirmed', 'completed'])
    
    by_type = {}
    for e in events.data:
        t = e.get('event_type', 'Outros')
        by_type[t] = by_type.get(t, 0) + 1
    
    return {
        'total_events': total,
        'confirmed': confirmed,
        'pending': total - confirmed,
        'total_revenue': revenue,
        'by_type': by_type
    }

# ================== ASSINATURAS MARKETPLACE ==================

@api_router.get("/subscriptions/plans")
async def get_subscription_plans(current_user: dict = Depends(get_current_user)):
    """Get available subscription plans"""
    result = supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
    return result.data

@api_router.post("/subscriptions/plans")
async def create_subscription_plan(plan: dict, current_user: dict = Depends(get_current_user)):
    """Create subscription plan (admin only)"""
    if current_user['role'] not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    plan['id'] = str(uuid.uuid4())
    supabase.table('subscription_plans').insert(plan).execute()
    return {"message": "Plano criado", "id": plan['id']}

@api_router.get("/subscriptions")
async def get_subscriptions(hotel_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get subscriptions"""
    query = supabase.table('subscriptions').select('*, subscription_plans(*), hotels(name)')
    
    if hotel_id:
        query = query.eq('hotel_id', hotel_id)
    elif current_user['role'] not in ['admin', 'superadmin']:
        # Regular users see only their hotel's subscriptions
        if current_user.get('hotel_id'):
            query = query.eq('hotel_id', current_user['hotel_id'])
        else:
            return []
    
    result = query.order('created_at', desc=True).execute()
    return result.data

@api_router.post("/subscriptions")
async def create_subscription(subscription: dict, current_user: dict = Depends(get_current_user)):
    """Create new subscription"""
    hotel_id = subscription.get('hotel_id') or current_user.get('hotel_id')
    if not hotel_id:
        hotels = supabase.table('hotels').select('id').limit(1).execute()
        if hotels.data:
            hotel_id = hotels.data[0]['id']
    
    sub_id = str(uuid.uuid4())
    
    # Get plan details
    plan = supabase.table('subscription_plans').select('*').eq('id', subscription['plan_id']).single().execute()
    
    # Calculate next billing date based on cycle
    cycle_days = {'weekly': 7, 'biweekly': 14, 'monthly': 30, 'quarterly': 90}
    days = cycle_days.get(plan.data.get('billing_cycle', 'monthly'), 30)
    next_billing = (datetime.now(timezone.utc) + timedelta(days=days)).strftime('%Y-%m-%d')
    
    sub_data = {
        'id': sub_id,
        'hotel_id': hotel_id,
        'plan_id': subscription['plan_id'],
        'status': 'active',
        'start_date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'next_billing_date': next_billing,
        'shipping_address': subscription.get('shipping_address'),
        'payment_method': subscription.get('payment_method', 'faturado')
    }
    
    supabase.table('subscriptions').insert(sub_data).execute()
    return {"message": "Assinatura criada", "id": sub_id}

@api_router.patch("/subscriptions/{subscription_id}/status")
async def update_subscription_status(subscription_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Update subscription status"""
    update_data = {
        'status': status,
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    if status == 'cancelled':
        update_data['cancelled_at'] = datetime.now(timezone.utc).isoformat()
    
    supabase.table('subscriptions').update(update_data).eq('id', subscription_id).execute()
    return {"message": f"Assinatura {status}"}

# ================== ROOT ==================

@api_router.get("/")
async def root():
    return {"message": "Hestia Hotel Management Platform API", "version": "2.0.0", "database": "Supabase"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
