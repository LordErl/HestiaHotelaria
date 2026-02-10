from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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

# ================== MODELS ==================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.RECEPTIONIST
    hotel_id: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.RECEPTIONIST
    hotel_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    hotel_id: Optional[str] = None
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Hotel Models
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
    payment_providers: List[PaymentProvider] = [PaymentProvider.STRIPE]

class Hotel(HotelCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

# Room Type Models
class RoomTypeCreate(BaseModel):
    name: str
    hotel_id: str
    description: Optional[str] = None
    base_price: float
    max_occupancy: int = 2
    amenities: List[str] = []
    images: List[str] = []

class RoomType(RoomTypeCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Room Models
class RoomCreate(BaseModel):
    number: str
    hotel_id: str
    room_type_id: str
    floor: int = 1
    status: RoomStatus = RoomStatus.AVAILABLE
    notes: Optional[str] = None

class Room(RoomCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoomUpdate(BaseModel):
    status: Optional[RoomStatus] = None
    notes: Optional[str] = None

# Guest Models
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

class Guest(GuestCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hotel_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_stays: int = 0
    total_spent: float = 0.0
    vip_status: bool = False

# Reservation Models
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

class Reservation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hotel_id: str
    guest_id: str
    room_id: str
    room_type_id: str
    check_in_date: str
    check_out_date: str
    actual_check_in: Optional[str] = None
    actual_check_out: Optional[str] = None
    adults: int = 1
    children: int = 0
    status: ReservationStatus = ReservationStatus.PENDING
    total_amount: float
    paid_amount: float = 0.0
    payment_status: PaymentStatus = PaymentStatus.PENDING
    notes: Optional[str] = None
    source: str = "direct"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class ReservationUpdate(BaseModel):
    status: Optional[ReservationStatus] = None
    room_id: Optional[str] = None
    notes: Optional[str] = None
    paid_amount: Optional[float] = None
    payment_status: Optional[PaymentStatus] = None

# Dashboard Models
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

# AI Chat Models
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    agent_type: str = "jarbas"  # jarbas or hestia
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
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        hotel_id=user_data.hotel_id
    )
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token(user.id, user.email, user.role.value)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            hotel_id=user.hotel_id,
            is_active=user.is_active
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = create_access_token(user['id'], user['email'], user['role'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            role=user['role'],
            hotel_id=user.get('hotel_id'),
            is_active=user.get('is_active', True)
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ================== HOTEL ROUTES ==================

@api_router.post("/hotels", response_model=Hotel)
async def create_hotel(hotel_data: HotelCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    hotel = Hotel(**hotel_data.model_dump())
    hotel_dict = hotel.model_dump()
    hotel_dict['created_at'] = hotel_dict['created_at'].isoformat()
    
    await db.hotels.insert_one(hotel_dict)
    return hotel

@api_router.get("/hotels", response_model=List[Hotel])
async def get_hotels(current_user: dict = Depends(get_current_user)):
    hotels = await db.hotels.find({}, {"_id": 0}).to_list(100)
    for h in hotels:
        if isinstance(h.get('created_at'), str):
            h['created_at'] = datetime.fromisoformat(h['created_at'])
    return hotels

@api_router.get("/hotels/{hotel_id}", response_model=Hotel)
async def get_hotel(hotel_id: str, current_user: dict = Depends(get_current_user)):
    hotel = await db.hotels.find_one({"id": hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel não encontrado")
    if isinstance(hotel.get('created_at'), str):
        hotel['created_at'] = datetime.fromisoformat(hotel['created_at'])
    return hotel

# ================== ROOM TYPE ROUTES ==================

@api_router.post("/room-types", response_model=RoomType)
async def create_room_type(room_type_data: RoomTypeCreate, current_user: dict = Depends(get_current_user)):
    room_type = RoomType(**room_type_data.model_dump())
    room_type_dict = room_type.model_dump()
    room_type_dict['created_at'] = room_type_dict['created_at'].isoformat()
    
    await db.room_types.insert_one(room_type_dict)
    return room_type

@api_router.get("/room-types", response_model=List[RoomType])
async def get_room_types(hotel_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"hotel_id": hotel_id} if hotel_id else {}
    room_types = await db.room_types.find(query, {"_id": 0}).to_list(100)
    for rt in room_types:
        if isinstance(rt.get('created_at'), str):
            rt['created_at'] = datetime.fromisoformat(rt['created_at'])
    return room_types

# ================== ROOM ROUTES ==================

@api_router.post("/rooms", response_model=Room)
async def create_room(room_data: RoomCreate, current_user: dict = Depends(get_current_user)):
    room = Room(**room_data.model_dump())
    room_dict = room.model_dump()
    room_dict['created_at'] = room_dict['created_at'].isoformat()
    
    await db.rooms.insert_one(room_dict)
    return room

@api_router.get("/rooms", response_model=List[Room])
async def get_rooms(hotel_id: Optional[str] = None, status: Optional[RoomStatus] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if hotel_id:
        query['hotel_id'] = hotel_id
    if status:
        query['status'] = status.value
    
    rooms = await db.rooms.find(query, {"_id": 0}).to_list(500)
    for r in rooms:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rooms

@api_router.patch("/rooms/{room_id}", response_model=Room)
async def update_room(room_id: str, room_update: RoomUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in room_update.model_dump().items() if v is not None}
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
    
    result = await db.rooms.find_one_and_update(
        {"id": room_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Quarto não encontrado")
    
    result.pop('_id', None)
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    return result

# ================== GUEST ROUTES ==================

@api_router.post("/guests", response_model=Guest)
async def create_guest(guest_data: GuestCreate, hotel_id: str, current_user: dict = Depends(get_current_user)):
    guest = Guest(**guest_data.model_dump(), hotel_id=hotel_id)
    guest_dict = guest.model_dump()
    guest_dict['created_at'] = guest_dict['created_at'].isoformat()
    
    await db.guests.insert_one(guest_dict)
    return guest

@api_router.get("/guests", response_model=List[Guest])
async def get_guests(hotel_id: Optional[str] = None, search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if hotel_id:
        query['hotel_id'] = hotel_id
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'document_number': {'$regex': search, '$options': 'i'}}
        ]
    
    guests = await db.guests.find(query, {"_id": 0}).to_list(500)
    for g in guests:
        if isinstance(g.get('created_at'), str):
            g['created_at'] = datetime.fromisoformat(g['created_at'])
    return guests

@api_router.get("/guests/{guest_id}", response_model=Guest)
async def get_guest(guest_id: str, current_user: dict = Depends(get_current_user)):
    guest = await db.guests.find_one({"id": guest_id}, {"_id": 0})
    if not guest:
        raise HTTPException(status_code=404, detail="Hóspede não encontrado")
    if isinstance(guest.get('created_at'), str):
        guest['created_at'] = datetime.fromisoformat(guest['created_at'])
    return guest

# ================== RESERVATION ROUTES ==================

@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(res_data: ReservationCreate, current_user: dict = Depends(get_current_user)):
    reservation = Reservation(
        **res_data.model_dump(),
        created_by=current_user['id']
    )
    res_dict = reservation.model_dump()
    res_dict['created_at'] = res_dict['created_at'].isoformat()
    
    await db.reservations.insert_one(res_dict)
    
    # Update room status
    await db.rooms.update_one(
        {"id": res_data.room_id},
        {"$set": {"status": RoomStatus.BLOCKED.value}}
    )
    
    return reservation

@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations(
    hotel_id: Optional[str] = None,
    status: Optional[ReservationStatus] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if hotel_id:
        query['hotel_id'] = hotel_id
    if status:
        query['status'] = status.value
    if date_from:
        query['check_in_date'] = {'$gte': date_from}
    if date_to:
        if 'check_in_date' in query:
            query['check_in_date']['$lte'] = date_to
        else:
            query['check_in_date'] = {'$lte': date_to}
    
    reservations = await db.reservations.find(query, {"_id": 0}).to_list(1000)
    for r in reservations:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return reservations

@api_router.get("/reservations/{reservation_id}", response_model=Reservation)
async def get_reservation(reservation_id: str, current_user: dict = Depends(get_current_user)):
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    if isinstance(reservation.get('created_at'), str):
        reservation['created_at'] = datetime.fromisoformat(reservation['created_at'])
    return reservation

@api_router.patch("/reservations/{reservation_id}", response_model=Reservation)
async def update_reservation(
    reservation_id: str,
    update_data: ReservationUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if 'status' in update_dict:
        update_dict['status'] = update_dict['status'].value
    if 'payment_status' in update_dict:
        update_dict['payment_status'] = update_dict['payment_status'].value
    
    result = await db.reservations.find_one_and_update(
        {"id": reservation_id},
        {"$set": update_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    result.pop('_id', None)
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    return result

# ================== CHECK-IN/OUT ROUTES ==================

@api_router.post("/reservations/{reservation_id}/check-in")
async def do_check_in(reservation_id: str, current_user: dict = Depends(get_current_user)):
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    if reservation['status'] not in ['pending', 'confirmed']:
        raise HTTPException(status_code=400, detail="Reserva não pode fazer check-in")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": "checked_in", "actual_check_in": now}}
    )
    
    await db.rooms.update_one(
        {"id": reservation['room_id']},
        {"$set": {"status": "occupied"}}
    )
    
    return {"message": "Check-in realizado com sucesso", "check_in_time": now}

@api_router.post("/reservations/{reservation_id}/check-out")
async def do_check_out(reservation_id: str, current_user: dict = Depends(get_current_user)):
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    if reservation['status'] != 'checked_in':
        raise HTTPException(status_code=400, detail="Reserva não está em check-in")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": "checked_out", "actual_check_out": now}}
    )
    
    await db.rooms.update_one(
        {"id": reservation['room_id']},
        {"$set": {"status": "cleaning"}}
    )
    
    # Update guest stats
    await db.guests.update_one(
        {"id": reservation['guest_id']},
        {"$inc": {"total_stays": 1, "total_spent": reservation['total_amount']}}
    )
    
    return {"message": "Check-out realizado com sucesso", "check_out_time": now}

# ================== DASHBOARD ROUTES ==================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(hotel_id: str, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    month_start = datetime.now(timezone.utc).strftime('%Y-%m-01')
    
    # Room stats
    total_rooms = await db.rooms.count_documents({"hotel_id": hotel_id})
    occupied_rooms = await db.rooms.count_documents({"hotel_id": hotel_id, "status": "occupied"})
    available_rooms = await db.rooms.count_documents({"hotel_id": hotel_id, "status": "available"})
    
    # Reservation stats
    todays_checkins = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_in_date": today,
        "status": {"$in": ["pending", "confirmed"]}
    })
    
    todays_checkouts = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "check_out_date": today,
        "status": "checked_in"
    })
    
    pending_reservations = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "status": "pending"
    })
    
    guests_in_house = await db.reservations.count_documents({
        "hotel_id": hotel_id,
        "status": "checked_in"
    })
    
    # Revenue
    today_revenue_pipeline = [
        {"$match": {"hotel_id": hotel_id, "actual_check_out": {"$regex": f"^{today}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    today_revenue_result = await db.reservations.aggregate(today_revenue_pipeline).to_list(1)
    revenue_today = today_revenue_result[0]['total'] if today_revenue_result else 0
    
    month_revenue_pipeline = [
        {"$match": {"hotel_id": hotel_id, "actual_check_out": {"$regex": f"^{month_start[:7]}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    month_revenue_result = await db.reservations.aggregate(month_revenue_pipeline).to_list(1)
    revenue_month = month_revenue_result[0]['total'] if month_revenue_result else 0
    
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
    """Get occupancy data for the last N days"""
    data = []
    total_rooms = await db.rooms.count_documents({"hotel_id": hotel_id})
    
    for i in range(days - 1, -1, -1):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        occupied = await db.reservations.count_documents({
            "hotel_id": hotel_id,
            "check_in_date": {"$lte": date},
            "check_out_date": {"$gt": date},
            "status": {"$in": ["checked_in", "checked_out"]}
        })
        occupancy = (occupied / total_rooms * 100) if total_rooms > 0 else 0
        data.append({
            "date": date,
            "occupancy": round(occupancy, 1),
            "occupied": occupied,
            "total": total_rooms
        })
    
    return data

@api_router.get("/dashboard/revenue-chart")
async def get_revenue_chart(hotel_id: str, days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get revenue data for the last N days"""
    data = []
    
    for i in range(days - 1, -1, -1):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        pipeline = [
            {"$match": {"hotel_id": hotel_id, "actual_check_out": {"$regex": f"^{date}"}}},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]
        result = await db.reservations.aggregate(pipeline).to_list(1)
        revenue = result[0]['total'] if result else 0
        data.append({
            "date": date,
            "revenue": revenue
        })
    
    return data

# ================== AI CHAT ROUTES ==================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Chat with Hestia (management) or Jarbas (guest) AI assistant"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    session_id = request.session_id or str(uuid.uuid4())
    
    if request.agent_type == "hestia":
        system_message = """Você é a Hestia, uma assistente de inteligência artificial para gestão hoteleira.
Você ajuda gestores e administradores de hotéis com:
- Análise de dados operacionais, financeiros e comerciais
- Insights acionáveis e sugestões de melhorias
- Interpretação de KPIs hoteleiros
- Revenue management e precificação
- Planejamento estratégico
Seja objetiva, analítica e profissional. Fale em português brasileiro."""
    else:  # jarbas
        system_message = """Você é o Jarbas, um mordomo digital elegante e acolhedor.
Você atende hóspedes de hotéis de luxo com:
- Informações sobre o hotel e serviços
- Auxílio em reservas e solicitações
- Recomendações personalizadas
- Atendimento cordial 24/7
Seja educado, elegante e prestativo. Transmita hospitalidade premium. Fale em português brasileiro."""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Store chat history
        await db.chat_history.insert_one({
            "session_id": session_id,
            "agent_type": request.agent_type,
            "user_id": current_user['id'],
            "user_message": request.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

# ================== SEED DATA ==================

@api_router.post("/seed")
async def seed_demo_data():
    """Seed demo data for testing"""
    # Check if already seeded
    existing = await db.hotels.find_one({"name": "Grand Hestia Palace"})
    if existing:
        return {"message": "Dados de demonstração já existem", "hotel_id": existing['id']}
    
    # Create demo hotel
    hotel = Hotel(
        name="Grand Hestia Palace",
        address="Av. Atlântica, 1702",
        city="Rio de Janeiro",
        country="Brasil",
        phone="+55 21 3232-0000",
        email="reservas@grandhestia.com",
        stars=5,
        description="Um oásis de luxo à beira-mar com vista para a Praia de Copacabana",
        amenities=["Spa", "Piscina", "Restaurante Gourmet", "Bar Rooftop", "Academia", "Concierge 24h"],
        payment_providers=[PaymentProvider.STRIPE, PaymentProvider.PIX]
    )
    hotel_dict = hotel.model_dump()
    hotel_dict['created_at'] = hotel_dict['created_at'].isoformat()
    await db.hotels.insert_one(hotel_dict)
    
    # Create room types
    room_types = [
        RoomType(
            name="Suite Deluxe Vista Mar",
            hotel_id=hotel.id,
            description="Suite espaçosa com vista panorâmica do oceano",
            base_price=1200.0,
            max_occupancy=2,
            amenities=["Varanda", "Banheira de Hidromassagem", "Minibar", "Smart TV 65\""],
            images=["https://images.unsplash.com/photo-1509647924673-bbb53e22eeb8"]
        ),
        RoomType(
            name="Suite Presidencial",
            hotel_id=hotel.id,
            description="A experiência máxima em luxo e conforto",
            base_price=3500.0,
            max_occupancy=4,
            amenities=["Sala de Estar", "Cozinha Gourmet", "Butler Service", "Heliponto Privativo"],
            images=["https://images.unsplash.com/photo-1759264244746-140bbbc54e1b"]
        ),
        RoomType(
            name="Quarto Superior",
            hotel_id=hotel.id,
            description="Conforto e elegância em espaço aconchegante",
            base_price=650.0,
            max_occupancy=2,
            amenities=["Smart TV", "Frigobar", "Cofre Digital"],
            images=["https://images.unsplash.com/photo-1759264244741-7175af0b7e75"]
        )
    ]
    
    for rt in room_types:
        rt_dict = rt.model_dump()
        rt_dict['created_at'] = rt_dict['created_at'].isoformat()
        await db.room_types.insert_one(rt_dict)
    
    # Create rooms
    floors = [1, 2, 3, 4, 5]
    statuses = [RoomStatus.AVAILABLE, RoomStatus.AVAILABLE, RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.CLEANING]
    
    for floor in floors:
        for i in range(1, 6):
            room_num = f"{floor}0{i}"
            room_type = room_types[i % 3]
            status = statuses[(floor + i) % 5]
            
            room = Room(
                number=room_num,
                hotel_id=hotel.id,
                room_type_id=room_type.id,
                floor=floor,
                status=status
            )
            room_dict = room.model_dump()
            room_dict['created_at'] = room_dict['created_at'].isoformat()
            await db.rooms.insert_one(room_dict)
    
    # Create demo guests
    guests_data = [
        {"name": "Maria Santos", "email": "maria@email.com", "phone": "+55 11 99999-0001", "document_number": "123.456.789-00"},
        {"name": "João Silva", "email": "joao@email.com", "phone": "+55 21 98888-0002", "document_number": "987.654.321-00"},
        {"name": "Ana Oliveira", "email": "ana@email.com", "phone": "+55 31 97777-0003", "document_number": "456.789.123-00"},
    ]
    
    guest_ids = []
    for gd in guests_data:
        guest = Guest(**gd, hotel_id=hotel.id)
        guest_dict = guest.model_dump()
        guest_dict['created_at'] = guest_dict['created_at'].isoformat()
        await db.guests.insert_one(guest_dict)
        guest_ids.append(guest.id)
    
    # Create demo reservations
    today = datetime.now(timezone.utc)
    rooms = await db.rooms.find({"hotel_id": hotel.id}, {"_id": 0}).to_list(25)
    
    reservations_data = [
        {"guest_idx": 0, "room_idx": 0, "days_offset": 0, "nights": 3, "status": ReservationStatus.CHECKED_IN, "amount": 3600.0},
        {"guest_idx": 1, "room_idx": 1, "days_offset": 1, "nights": 2, "status": ReservationStatus.CONFIRMED, "amount": 1300.0},
        {"guest_idx": 2, "room_idx": 2, "days_offset": -1, "nights": 5, "status": ReservationStatus.CHECKED_IN, "amount": 6000.0},
        {"guest_idx": 0, "room_idx": 5, "days_offset": 3, "nights": 2, "status": ReservationStatus.PENDING, "amount": 2400.0},
    ]
    
    for rd in reservations_data:
        check_in = (today + timedelta(days=rd['days_offset'])).strftime('%Y-%m-%d')
        check_out = (today + timedelta(days=rd['days_offset'] + rd['nights'])).strftime('%Y-%m-%d')
        
        reservation = Reservation(
            hotel_id=hotel.id,
            guest_id=guest_ids[rd['guest_idx']],
            room_id=rooms[rd['room_idx']]['id'],
            room_type_id=rooms[rd['room_idx']]['room_type_id'],
            check_in_date=check_in,
            check_out_date=check_out,
            status=rd['status'],
            total_amount=rd['amount'],
            paid_amount=rd['amount'] if rd['status'] == ReservationStatus.CHECKED_IN else 0,
            payment_status=PaymentStatus.PAID if rd['status'] == ReservationStatus.CHECKED_IN else PaymentStatus.PENDING
        )
        res_dict = reservation.model_dump()
        res_dict['created_at'] = res_dict['created_at'].isoformat()
        if rd['status'] == ReservationStatus.CHECKED_IN:
            res_dict['actual_check_in'] = (today + timedelta(days=rd['days_offset'])).isoformat()
        await db.reservations.insert_one(res_dict)
    
    return {"message": "Dados de demonstração criados com sucesso", "hotel_id": hotel.id}

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
    """Get all active hotels for public booking"""
    hotels = await db.hotels.find({"is_active": True}, {"_id": 0}).to_list(100)
    for h in hotels:
        if isinstance(h.get('created_at'), str):
            h['created_at'] = datetime.fromisoformat(h['created_at'])
    return hotels

@api_router.get("/public/availability")
async def check_availability(
    hotel_id: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    children: int = 0
):
    """Check room availability for dates"""
    # Get all rooms for hotel
    all_rooms = await db.rooms.find({"hotel_id": hotel_id}, {"_id": 0}).to_list(500)
    
    # Get reservations that overlap with requested dates
    overlapping = await db.reservations.find({
        "hotel_id": hotel_id,
        "status": {"$in": ["pending", "confirmed", "checked_in"]},
        "$or": [
            {"check_in_date": {"$lt": check_out}, "check_out_date": {"$gt": check_in}}
        ]
    }, {"_id": 0}).to_list(1000)
    
    booked_room_ids = {r['room_id'] for r in overlapping}
    
    # Filter available rooms
    available_rooms = [r for r in all_rooms if r['id'] not in booked_room_ids and r['status'] == 'available']
    
    # Get room types
    room_types = await db.room_types.find({"hotel_id": hotel_id}, {"_id": 0}).to_list(100)
    
    # Filter room types that can accommodate guests
    total_guests = adults + children
    valid_room_types = [rt for rt in room_types if rt.get('max_occupancy', 2) >= total_guests]
    
    # Convert dates
    for rt in valid_room_types:
        if isinstance(rt.get('created_at'), str):
            rt['created_at'] = datetime.fromisoformat(rt['created_at'])
    
    for r in available_rooms:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    
    return {
        "rooms": available_rooms,
        "room_types": valid_room_types,
        "check_in": check_in,
        "check_out": check_out
    }

@api_router.post("/public/reservations")
async def create_public_reservation(data: PublicReservationCreate):
    """Create a reservation from the public booking engine"""
    # Create or find guest
    existing_guest = await db.guests.find_one({
        "email": data.guest.email,
        "hotel_id": data.hotel_id
    })
    
    if existing_guest:
        guest_id = existing_guest['id']
    else:
        guest = Guest(
            name=data.guest.name,
            email=data.guest.email,
            phone=data.guest.phone,
            document_number=data.guest.document_number,
            hotel_id=data.hotel_id,
            notes=data.guest.special_requests
        )
        guest_dict = guest.model_dump()
        guest_dict['created_at'] = guest_dict['created_at'].isoformat()
        await db.guests.insert_one(guest_dict)
        guest_id = guest.id
    
    # Generate confirmation code
    confirmation_code = str(uuid.uuid4())[:8].upper()
    
    # Create reservation
    reservation = Reservation(
        hotel_id=data.hotel_id,
        guest_id=guest_id,
        room_id=data.room_id,
        room_type_id=data.room_type_id,
        check_in_date=data.check_in_date,
        check_out_date=data.check_out_date,
        adults=data.adults,
        children=data.children,
        status=ReservationStatus.CONFIRMED,
        total_amount=data.total_amount,
        payment_status=PaymentStatus.PENDING,
        source="booking_engine",
        notes=data.guest.special_requests
    )
    
    res_dict = reservation.model_dump()
    res_dict['created_at'] = res_dict['created_at'].isoformat()
    res_dict['confirmation_code'] = confirmation_code
    res_dict['payment_provider'] = data.payment_provider
    
    await db.reservations.insert_one(res_dict)
    
    # Update room status
    await db.rooms.update_one(
        {"id": data.room_id},
        {"$set": {"status": RoomStatus.BLOCKED.value}}
    )
    
    return {
        "id": reservation.id,
        "confirmation_code": confirmation_code,
        "status": "confirmed",
        "message": "Reserva criada com sucesso"
    }

# ================== GUEST PORTAL ROUTES ==================

@api_router.post("/guest-portal/login")
async def guest_portal_login(credentials: GuestPortalLogin):
    """Login to guest portal using email and confirmation code"""
    # Find reservation by confirmation code
    reservation = await db.reservations.find_one({
        "confirmation_code": credentials.confirmation_code.upper()
    })
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    # Get guest
    guest = await db.guests.find_one({"id": reservation['guest_id']})
    if not guest or guest.get('email', '').lower() != credentials.email.lower():
        raise HTTPException(status_code=401, detail="Email não corresponde à reserva")
    
    # Get hotel
    hotel = await db.hotels.find_one({"id": reservation['hotel_id']}, {"_id": 0})
    
    # Get room info
    room = await db.rooms.find_one({"id": reservation['room_id']}, {"_id": 0})
    room_type = await db.room_types.find_one({"id": reservation['room_type_id']}, {"_id": 0})
    
    # Get all reservations for this guest
    all_reservations = await db.reservations.find(
        {"guest_id": guest['id']}, 
        {"_id": 0}
    ).to_list(100)
    
    # Add room info to reservations
    for res in all_reservations:
        res_room = await db.rooms.find_one({"id": res['room_id']}, {"_id": 0})
        res_room_type = await db.room_types.find_one({"id": res['room_type_id']}, {"_id": 0})
        res['room_number'] = res_room.get('number') if res_room else 'N/A'
        res['room_type_name'] = res_room_type.get('name') if res_room_type else 'N/A'
    
    # Current reservation with details
    current_res = None
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    for res in all_reservations:
        if res['status'] in ['confirmed', 'checked_in'] and res['check_in_date'] <= today <= res['check_out_date']:
            current_res = res
            break
        elif res['status'] in ['confirmed', 'pending'] and res['check_in_date'] >= today:
            current_res = res
            break
    
    if not current_res:
        current_res = reservation.copy()
        current_res['room_number'] = room.get('number') if room else 'N/A'
        current_res['room_type_name'] = room_type.get('name') if room_type else 'N/A'
    
    # Create guest token
    token = create_access_token(guest['id'], guest.get('email', ''), 'guest')
    
    return {
        "token": token,
        "guest": {
            "id": guest['id'],
            "name": guest['name'],
            "email": guest.get('email'),
            "phone": guest.get('phone'),
            "vip_status": guest.get('vip_status', False),
            "total_stays": guest.get('total_stays', 0)
        },
        "hotel": hotel,
        "current_reservation": current_res,
        "reservations": all_reservations
    }

@api_router.post("/guest-portal/chat")
async def guest_portal_chat(request: GuestChatRequest):
    """Chat with Jarbas from guest portal"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    session_id = request.session_id or str(uuid.uuid4())
    
    system_message = """Você é o Jarbas, um mordomo digital elegante e acolhedor.
Você atende hóspedes de hotéis de luxo com:
- Informações sobre o hotel e serviços
- Auxílio em reservas e solicitações
- Recomendações personalizadas
- Atendimento cordial 24/7

Serviços disponíveis que você pode ajudar:
- Room Service (café da manhã, almoço, jantar, lanches)
- Housekeeping (limpeza, toalhas, amenities extras)
- Concierge (reservas em restaurantes, passeios, transporte)
- Spa (agendamento de tratamentos)
- Informações do hotel (horários, localizações, WiFi)

Seja educado, elegante e prestativo. Transmita hospitalidade premium. Fale em português brasileiro."""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Store chat history
        await db.guest_chat_history.insert_one({
            "session_id": session_id,
            "guest_id": request.guest_id,
            "user_message": request.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"Guest Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

# ================== ROOT ==================

@api_router.get("/")
async def root():
    return {"message": "Hestia Hotel Management Platform API", "version": "2.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
