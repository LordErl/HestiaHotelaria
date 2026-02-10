import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  LogIn, 
  LogOut,
  Search,
  User,
  BedDouble,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckInOutPage = () => {
  const { currentHotel } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!currentHotel) return;
    
    try {
      setLoading(true);
      const [resRes, guestsRes, roomsRes] = await Promise.all([
        axios.get(`${API}/reservations?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/guests?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/rooms?hotel_id=${currentHotel.id}`)
      ]);
      
      setReservations(resRes.data);
      setGuests(guestsRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentHotel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async (reservationId) => {
    setProcessingId(reservationId);
    try {
      await axios.post(`${API}/reservations/${reservationId}/check-in`);
      fetchData();
    } catch (error) {
      console.error('Check-in error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (reservationId) => {
    setProcessingId(reservationId);
    try {
      await axios.post(`${API}/reservations/${reservationId}/check-out`);
      fetchData();
    } catch (error) {
      console.error('Check-out error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getGuestName = (guestId) => guests.find(g => g.id === guestId)?.name || 'Desconhecido';
  const getRoomNumber = (roomId) => rooms.find(r => r.id === roomId)?.number || 'N/A';

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Arrivals: pending or confirmed, check-in today or passed
  const arrivals = reservations.filter(r => 
    ['pending', 'confirmed'].includes(r.status) && 
    r.check_in_date <= todayStr
  );
  
  // In-house: checked_in
  const inHouse = reservations.filter(r => r.status === 'checked_in');
  
  // Departures: checked_in with check_out today or passed
  const departures = inHouse.filter(r => r.check_out_date <= todayStr);

  const filterBySearch = (list) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(r => {
      const guestName = getGuestName(r.guest_id).toLowerCase();
      const roomNum = getRoomNumber(r.room_id).toLowerCase();
      return guestName.includes(term) || roomNum.includes(term);
    });
  };

  const ReservationCard = ({ reservation, type }) => {
    const isProcessing = processingId === reservation.id;
    
    return (
      <Card className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#F8FAFC]">{getGuestName(reservation.guest_id)}</h3>
                <p className="text-xs text-[#94A3B8]">
                  {reservation.adults} adulto{reservation.adults !== 1 ? 's' : ''}
                  {reservation.children > 0 && `, ${reservation.children} criança${reservation.children !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <Badge className={`
              ${type === 'arrival' ? 'bg-blue-400/20 text-blue-400 border-blue-400/30' : ''}
              ${type === 'inhouse' ? 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30' : ''}
              ${type === 'departure' ? 'bg-orange-400/20 text-orange-400 border-orange-400/30' : ''}
              border
            `}>
              {type === 'arrival' && 'Chegada'}
              {type === 'inhouse' && 'Hospedado'}
              {type === 'departure' && 'Saída'}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <BedDouble className="w-4 h-4" />
              <span>Quarto {getRoomNumber(reservation.room_id)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(reservation.check_in_date).toLocaleDateString('pt-BR')} 
                <ArrowRight className="w-3 h-3 inline mx-1" />
                {new Date(reservation.check_out_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-[#F8FAFC] font-semibold">
                R$ {reservation.total_amount?.toLocaleString('pt-BR')}
              </span>
              <span className={`text-xs ${
                reservation.payment_status === 'paid' ? 'text-emerald-400' : 'text-orange-400'
              }`}>
                ({reservation.payment_status === 'paid' ? 'Pago' : 'Pendente'})
              </span>
            </div>
          </div>

          {type === 'arrival' && (
            <Button
              onClick={() => handleCheckIn(reservation.id)}
              disabled={isProcessing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              data-testid={`checkin-btn-${reservation.id}`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Realizar Check-in
                </>
              )}
            </Button>
          )}

          {type === 'departure' && (
            <Button
              onClick={() => handleCheckOut(reservation.id)}
              disabled={isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              data-testid={`checkout-btn-${reservation.id}`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Realizar Check-out
                </>
              )}
            </Button>
          )}

          {type === 'inhouse' && !departures.find(d => d.id === reservation.id) && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Hospedado até {new Date(reservation.check_out_date).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentHotel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#94A3B8]">Selecione um hotel para acessar Check-in/Out.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="checkinout-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Check-in / Check-out</h1>
        <p className="text-[#94A3B8] mt-1">Gerencie chegadas e saídas de hóspedes</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-400/10 border-blue-400/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-400/20 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{arrivals.length}</p>
              <p className="text-sm text-[#94A3B8]">Chegadas Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-400/10 border-emerald-400/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-400/20 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{inHouse.length}</p>
              <p className="text-sm text-[#94A3B8]">Na Casa</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-400/10 border-orange-400/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-400/20 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{departures.length}</p>
              <p className="text-sm text-[#94A3B8]">Saídas Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <Input
          placeholder="Buscar por hóspede ou quarto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#151E32]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
          data-testid="search-checkinout"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="arrivals" className="w-full">
        <TabsList className="bg-[#151E32]/50 border border-white/10 p-1">
          <TabsTrigger 
            value="arrivals" 
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120]"
            data-testid="arrivals-tab"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Chegadas ({arrivals.length})
          </TabsTrigger>
          <TabsTrigger 
            value="inhouse"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120]"
            data-testid="inhouse-tab"
          >
            <User className="w-4 h-4 mr-2" />
            Na Casa ({inHouse.length})
          </TabsTrigger>
          <TabsTrigger 
            value="departures"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120]"
            data-testid="departures-tab"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Saídas ({departures.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arrivals" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-[#151E32]/50 border-white/5 animate-pulse">
                  <CardContent className="p-6 h-48" />
                </Card>
              ))}
            </div>
          ) : filterBySearch(arrivals).length === 0 ? (
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-12 text-center">
                <LogIn className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
                <p className="text-[#94A3B8]">Nenhuma chegada pendente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBySearch(arrivals).map(reservation => (
                <ReservationCard key={reservation.id} reservation={reservation} type="arrival" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inhouse" className="mt-6">
          {filterBySearch(inHouse).length === 0 ? (
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-12 text-center">
                <User className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
                <p className="text-[#94A3B8]">Nenhum hóspede na casa</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBySearch(inHouse).map(reservation => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  type={departures.find(d => d.id === reservation.id) ? 'departure' : 'inhouse'} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="departures" className="mt-6">
          {filterBySearch(departures).length === 0 ? (
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-12 text-center">
                <LogOut className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
                <p className="text-[#94A3B8]">Nenhuma saída pendente hoje</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBySearch(departures).map(reservation => (
                <ReservationCard key={reservation.id} reservation={reservation} type="departure" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CheckInOutPage;
