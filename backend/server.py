from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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
    
    # Update guest stats
    supabase.rpc('increment_guest_stats', {
        'p_guest_id': reservation['guest_id'],
        'p_amount': float(reservation['total_amount'])
    }).execute()
    
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
