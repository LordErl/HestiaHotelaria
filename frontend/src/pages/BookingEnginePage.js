import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Crown, 
  CalendarIcon, 
  BedDouble, 
  Users, 
  MapPin,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  ChevronRight,
  Check,
  CreditCard,
  QrCode,
  Loader2,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingEnginePage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [processing, setProcessing] = useState(false);
  
  // Booking state
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  
  // Guest info
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    document_number: '',
    special_requests: ''
  });
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [reservationResult, setReservationResult] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await axios.get(`${API}/public/hotels`);
      setHotels(response.data);
      if (response.data.length > 0) {
        setSelectedHotel(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchAvailability = async () => {
    if (!selectedHotel || !checkInDate || !checkOutDate) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/public/availability`, {
        params: {
          hotel_id: selectedHotel.id,
          check_in: format(checkInDate, 'yyyy-MM-dd'),
          check_out: format(checkOutDate, 'yyyy-MM-dd'),
          adults,
          children
        }
      });
      setAvailableRooms(response.data.rooms);
      setRoomTypes(response.data.room_types);
      setStep(2);
    } catch (error) {
      console.error('Error searching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectRoom = (room, roomType) => {
    setSelectedRoom(room);
    setSelectedRoomType(roomType);
    setStep(3);
  };

  const calculateTotal = () => {
    if (!selectedRoomType || !checkInDate || !checkOutDate) return 0;
    const nights = differenceInDays(checkOutDate, checkInDate);
    return selectedRoomType.base_price * nights;
  };

  const handleCreateReservation = async () => {
    if (!guestData.name || !guestData.email || !guestData.document_number) return;
    
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/public/reservations`, {
        hotel_id: selectedHotel.id,
        room_id: selectedRoom.id,
        room_type_id: selectedRoomType.id,
        check_in_date: format(checkInDate, 'yyyy-MM-dd'),
        check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
        adults,
        children,
        total_amount: calculateTotal(),
        guest: guestData,
        payment_provider: paymentMethod
      });
      
      setReservationResult(response.data);
      setStep(5);
    } catch (error) {
      console.error('Error creating reservation:', error);
    } finally {
      setProcessing(false);
    }
  };

  const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;

  const amenityIcons = {
    'Wifi': Wifi,
    'Estacionamento': Car,
    'Café da Manhã': Coffee,
    'Academia': Dumbbell,
  };

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Header */}
      <header className="bg-[#151E32]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-[#F8FAFC]">Hestia</h1>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Reservas Online</p>
              </div>
            </div>
            
            {/* Steps indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${step >= s 
                      ? 'bg-[#D4AF37] text-[#0B1120]' 
                      : 'bg-[#151E32] text-[#94A3B8] border border-white/10'
                    }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Search */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in" data-testid="booking-step-1">
            {/* Hero */}
            {selectedHotel && (
              <div className="relative rounded-2xl overflow-hidden h-[400px]">
                <img 
                  src="https://images.unsplash.com/photo-1509647924673-bbb53e22eeb8?w=1920&q=80" 
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(selectedHotel.stars || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                    ))}
                  </div>
                  <h2 className="font-display text-4xl font-bold text-[#F8FAFC] mb-2">{selectedHotel.name}</h2>
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedHotel.city}, {selectedHotel.country}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search Form */}
            <Card className="bg-[#151E32]/80 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Check-in */}
                  <div className="space-y-2">
                    <Label className="text-[#E8DCC4]">Check-in</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] hover:bg-white/5"
                          data-testid="checkin-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkInDate ? format(checkInDate, 'dd/MM/yyyy') : 'Selecionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#151E32] border-white/10">
                        <Calendar
                          mode="single"
                          selected={checkInDate}
                          onSelect={setCheckInDate}
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Check-out */}
                  <div className="space-y-2">
                    <Label className="text-[#E8DCC4]">Check-out</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] hover:bg-white/5"
                          data-testid="checkout-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOutDate ? format(checkOutDate, 'dd/MM/yyyy') : 'Selecionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#151E32] border-white/10">
                        <Calendar
                          mode="single"
                          selected={checkOutDate}
                          onSelect={setCheckOutDate}
                          disabled={(date) => date <= (checkInDate || new Date())}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Adults */}
                  <div className="space-y-2">
                    <Label className="text-[#E8DCC4]">Adultos</Label>
                    <Select value={adults.toString()} onValueChange={(v) => setAdults(parseInt(v))}>
                      <SelectTrigger className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]" data-testid="adults-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151E32] border-white/10">
                        {[1,2,3,4,5,6].map(n => (
                          <SelectItem key={n} value={n.toString()} className="text-[#F8FAFC]">{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Children */}
                  <div className="space-y-2">
                    <Label className="text-[#E8DCC4]">Crianças</Label>
                    <Select value={children.toString()} onValueChange={(v) => setChildren(parseInt(v))}>
                      <SelectTrigger className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]" data-testid="children-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151E32] border-white/10">
                        {[0,1,2,3,4].map(n => (
                          <SelectItem key={n} value={n.toString()} className="text-[#F8FAFC]">{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Button */}
                  <div className="space-y-2">
                    <Label className="text-transparent">.</Label>
                    <Button
                      onClick={searchAvailability}
                      disabled={!checkInDate || !checkOutDate}
                      className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold h-10"
                      data-testid="search-availability-btn"
                    >
                      Buscar Disponibilidade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Features */}
            {selectedHotel && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(selectedHotel.amenities || ['Wifi', 'Estacionamento', 'Café da Manhã', 'Academia']).slice(0, 4).map((amenity, i) => {
                  const Icon = amenityIcons[amenity] || Star;
                  return (
                    <Card key={i} className="bg-[#151E32]/50 border-white/5">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                        <span className="text-[#F8FAFC] text-sm">{amenity}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Room */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in" data-testid="booking-step-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">Selecione sua Acomodação</h2>
                <p className="text-[#94A3B8]">
                  {nights} noite{nights !== 1 ? 's' : ''} • {format(checkInDate, "dd 'de' MMMM", { locale: ptBR })} - {format(checkOutDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setStep(1)} className="text-[#94A3B8]">
                Alterar datas
              </Button>
            </div>

            {availableRooms.length === 0 ? (
              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-12 text-center">
                  <BedDouble className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
                  <p className="text-[#F8FAFC] font-semibold">Sem disponibilidade</p>
                  <p className="text-[#94A3B8] mt-2">Não encontramos quartos disponíveis para as datas selecionadas.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {roomTypes.map((type) => {
                  const rooms = availableRooms.filter(r => r.room_type_id === type.id);
                  if (rooms.length === 0) return null;
                  
                  const totalPrice = type.base_price * nights;
                  
                  return (
                    <Card 
                      key={type.id} 
                      className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300 overflow-hidden"
                    >
                      <div className="relative h-48">
                        <img 
                          src={type.images?.[0] || "https://images.unsplash.com/photo-1509647924673-bbb53e22eeb8?w=800"} 
                          alt={type.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 right-4 bg-emerald-500/90 text-white border-0">
                          {rooms.length} disponível
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-display text-xl font-bold text-[#F8FAFC] mb-2">{type.name}</h3>
                        <p className="text-[#94A3B8] text-sm mb-4">{type.description}</p>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1 text-[#94A3B8] text-sm">
                            <Users className="w-4 h-4" />
                            <span>Até {type.max_occupancy} pessoas</span>
                          </div>
                        </div>

                        {type.amenities && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {type.amenities.slice(0, 4).map((amenity, i) => (
                              <Badge key={i} variant="outline" className="border-white/10 text-[#94A3B8] text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div>
                            <p className="text-[#94A3B8] text-xs">Total para {nights} noite{nights !== 1 ? 's' : ''}</p>
                            <p className="font-display text-2xl font-bold text-[#D4AF37]">
                              R$ {totalPrice.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            onClick={() => selectRoom(rooms[0], type)}
                            className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold"
                            data-testid={`select-room-${type.id}`}
                          >
                            Selecionar
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Guest Information */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" data-testid="booking-step-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">Informações do Hóspede</h2>
                <p className="text-[#94A3B8]">Preencha seus dados para a reserva</p>
              </div>

              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#E8DCC4]">Nome Completo *</Label>
                      <Input
                        value={guestData.name}
                        onChange={(e) => setGuestData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                        className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                        data-testid="guest-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#E8DCC4]">Email *</Label>
                      <Input
                        type="email"
                        value={guestData.email}
                        onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="seu@email.com"
                        className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                        data-testid="guest-email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#E8DCC4]">Telefone</Label>
                      <Input
                        value={guestData.phone}
                        onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+55 11 99999-0000"
                        className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                        data-testid="guest-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#E8DCC4]">CPF *</Label>
                      <Input
                        value={guestData.document_number}
                        onChange={(e) => setGuestData(prev => ({ ...prev, document_number: e.target.value }))}
                        placeholder="000.000.000-00"
                        className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                        data-testid="guest-cpf"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#E8DCC4]">Pedidos Especiais</Label>
                    <Input
                      value={guestData.special_requests}
                      onChange={(e) => setGuestData(prev => ({ ...prev, special_requests: e.target.value }))}
                      placeholder="Preferências, alergias, andar alto, etc..."
                      className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                      data-testid="guest-requests"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => setStep(4)}
                disabled={!guestData.name || !guestData.email || !guestData.document_number}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold py-6"
                data-testid="continue-to-payment"
              >
                Continuar para Pagamento
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Summary Sidebar */}
            <div>
              <Card className="bg-[#151E32]/50 border-white/5 sticky top-24">
                <CardHeader>
                  <CardTitle className="font-display text-lg text-[#F8FAFC]">Resumo da Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={selectedRoomType?.images?.[0] || "https://images.unsplash.com/photo-1509647924673-bbb53e22eeb8?w=400"} 
                      alt={selectedRoomType?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-[#F8FAFC]">{selectedRoomType?.name}</h4>
                    <p className="text-sm text-[#94A3B8]">{selectedHotel?.name}</p>
                  </div>

                  <div className="space-y-2 py-4 border-y border-white/5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Check-in</span>
                      <span className="text-[#F8FAFC]">{checkInDate && format(checkInDate, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Check-out</span>
                      <span className="text-[#F8FAFC]">{checkOutDate && format(checkOutDate, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Hóspedes</span>
                      <span className="text-[#F8FAFC]">{adults} adulto{adults !== 1 ? 's' : ''}{children > 0 && `, ${children} criança${children !== 1 ? 's' : ''}`}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">{nights} noite{nights !== 1 ? 's' : ''} x R$ {selectedRoomType?.base_price?.toLocaleString('pt-BR')}</span>
                      <span className="text-[#F8FAFC]">R$ {calculateTotal().toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <span className="font-semibold text-[#F8FAFC]">Total</span>
                    <span className="font-display text-2xl font-bold text-[#D4AF37]">
                      R$ {calculateTotal().toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" data-testid="booking-step-4">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">Forma de Pagamento</h2>
                <p className="text-[#94A3B8]">Escolha como deseja pagar</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'stripe', name: 'Cartão de Crédito', icon: CreditCard, desc: 'Visa, Master, Amex' },
                  { id: 'mercado_pago', name: 'Mercado Pago', icon: QrCode, desc: 'PIX, Boleto, Cartão' },
                  { id: 'pix', name: 'PIX', icon: QrCode, desc: 'Pagamento instantâneo' },
                ].map((method) => (
                  <Card 
                    key={method.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      paymentMethod === method.id 
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' 
                        : 'bg-[#151E32]/50 border-white/5 hover:border-white/20'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                    data-testid={`payment-${method.id}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                        paymentMethod === method.id ? 'bg-[#D4AF37]/20' : 'bg-white/5'
                      }`}>
                        <method.icon className={`w-6 h-6 ${
                          paymentMethod === method.id ? 'text-[#D4AF37]' : 'text-[#94A3B8]'
                        }`} />
                      </div>
                      <h4 className={`font-semibold ${
                        paymentMethod === method.id ? 'text-[#D4AF37]' : 'text-[#F8FAFC]'
                      }`}>{method.name}</h4>
                      <p className="text-xs text-[#94A3B8] mt-1">{method.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-[#F8FAFC] font-semibold">Pagamento seguro</p>
                      <p className="text-sm text-[#94A3B8]">Seus dados estão protegidos com criptografia de ponta a ponta</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="border-white/10 text-[#94A3B8] hover:bg-white/5"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleCreateReservation}
                  disabled={processing}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold py-6"
                  data-testid="confirm-reservation"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Confirmar Reserva - R$ {calculateTotal().toLocaleString('pt-BR')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div>
              <Card className="bg-[#151E32]/50 border-white/5 sticky top-24">
                <CardHeader>
                  <CardTitle className="font-display text-lg text-[#F8FAFC]">Resumo da Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#F8FAFC]">{selectedRoomType?.name}</h4>
                    <p className="text-sm text-[#94A3B8]">{selectedHotel?.name}</p>
                  </div>

                  <div className="space-y-2 py-4 border-y border-white/5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Hóspede</span>
                      <span className="text-[#F8FAFC]">{guestData.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Check-in</span>
                      <span className="text-[#F8FAFC]">{checkInDate && format(checkInDate, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Check-out</span>
                      <span className="text-[#F8FAFC]">{checkOutDate && format(checkOutDate, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <span className="font-semibold text-[#F8FAFC]">Total</span>
                    <span className="font-display text-2xl font-bold text-[#D4AF37]">
                      R$ {calculateTotal().toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && reservationResult && (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in" data-testid="booking-step-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold text-[#F8FAFC] mb-2">Reserva Confirmada!</h2>
              <p className="text-[#94A3B8]">
                Um email de confirmação foi enviado para {guestData.email}
              </p>
            </div>

            <Card className="bg-[#151E32]/50 border-white/5 text-left">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-[#94A3B8]">Código da Reserva</span>
                  <span className="font-display text-xl font-bold text-[#D4AF37]">
                    {reservationResult.confirmation_code || reservationResult.id?.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase">Hotel</p>
                    <p className="text-[#F8FAFC]">{selectedHotel?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase">Acomodação</p>
                    <p className="text-[#F8FAFC]">{selectedRoomType?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase">Check-in</p>
                    <p className="text-[#F8FAFC]">{checkInDate && format(checkInDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase">Check-out</p>
                    <p className="text-[#F8FAFC]">{checkOutDate && format(checkOutDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Valor Total</span>
                    <span className="font-display text-xl font-bold text-[#D4AF37]">
                      R$ {calculateTotal().toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/guest-portal'}
                className="border-white/10 text-[#94A3B8] hover:bg-white/5"
              >
                Acessar Portal do Hóspede
              </Button>
              <Button
                onClick={() => {
                  setStep(1);
                  setSelectedRoom(null);
                  setSelectedRoomType(null);
                  setGuestData({ name: '', email: '', phone: '', document_number: '', special_requests: '' });
                }}
                className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120]"
              >
                Nova Reserva
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#151E32]/50 border-t border-white/5 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#94A3B8] text-sm">
            &copy; 2024 Hestia Hotel Management. Reservas diretas sem comissão.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BookingEnginePage;
