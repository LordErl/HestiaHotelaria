import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  User,
  BedDouble,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-orange-400/20 text-orange-400 border-orange-400/30', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'bg-blue-400/20 text-blue-400 border-blue-400/30', icon: CheckCircle2 },
  checked_in: { label: 'Hospedado', color: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30', icon: CheckCircle2 },
  checked_out: { label: 'Finalizado', color: 'bg-[#94A3B8]/20 text-[#94A3B8] border-[#94A3B8]/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-red-400/20 text-red-400 border-red-400/30', icon: XCircle },
  no_show: { label: 'No-Show', color: 'bg-red-400/20 text-red-400 border-red-400/30', icon: AlertCircle },
};

const paymentStatusConfig = {
  pending: { label: 'Pendente', color: 'text-orange-400' },
  partial: { label: 'Parcial', color: 'text-yellow-400' },
  paid: { label: 'Pago', color: 'text-emerald-400' },
  refunded: { label: 'Estornado', color: 'text-red-400' },
};

const ReservationsPage = () => {
  const { currentHotel } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    room_type_id: '',
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    total_amount: 0,
    notes: ''
  });

  const fetchData = useCallback(async () => {
    if (!currentHotel) return;
    
    try {
      setLoading(true);
      const [resRes, guestsRes, roomsRes, typesRes] = await Promise.all([
        axios.get(`${API}/reservations?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/guests?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/rooms?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/room-types?hotel_id=${currentHotel.id}`)
      ]);
      
      setReservations(resRes.data);
      setGuests(guestsRes.data);
      setRooms(roomsRes.data);
      setRoomTypes(typesRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentHotel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateReservation = async () => {
    if (!currentHotel || !formData.guest_id || !formData.room_id || !formData.check_in_date || !formData.check_out_date) {
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API}/reservations`, {
        ...formData,
        hotel_id: currentHotel.id
      });
      
      setIsCreateOpen(false);
      setFormData({
        guest_id: '',
        room_id: '',
        room_type_id: '',
        check_in_date: '',
        check_out_date: '',
        adults: 1,
        children: 0,
        total_amount: 0,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Create reservation error:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRoomChange = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setFormData(prev => ({
        ...prev,
        room_id: roomId,
        room_type_id: room.room_type_id
      }));
    }
  };

  const getGuestName = (guestId) => {
    const guest = guests.find(g => g.id === guestId);
    return guest?.name || 'Desconhecido';
  };

  const getRoomNumber = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.number || 'N/A';
  };

  const getRoomTypeName = (typeId) => {
    const type = roomTypes.find(t => t.id === typeId);
    return type?.name || 'N/A';
  };

  const filteredReservations = reservations.filter(res => {
    const guestName = getGuestName(res.guest_id).toLowerCase();
    const matchesSearch = guestName.includes(searchTerm.toLowerCase()) || 
                          getRoomNumber(res.room_id).includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!currentHotel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#94A3B8]">Selecione um hotel para ver as reservas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reservations-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Reservas</h1>
          <p className="text-[#94A3B8] mt-1">Gerencie todas as reservas do hotel</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold"
              data-testid="new-reservation-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC] max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Nova Reserva</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Hóspede</Label>
                <Select value={formData.guest_id} onValueChange={(v) => setFormData(prev => ({ ...prev, guest_id: v }))}>
                  <SelectTrigger className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]" data-testid="guest-select">
                    <SelectValue placeholder="Selecione o hóspede" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151E32] border-white/10">
                    {guests.map(guest => (
                      <SelectItem key={guest.id} value={guest.id} className="text-[#F8FAFC] hover:bg-white/5">
                        {guest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Quarto</Label>
                <Select value={formData.room_id} onValueChange={handleRoomChange}>
                  <SelectTrigger className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]" data-testid="room-select">
                    <SelectValue placeholder="Selecione o quarto" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151E32] border-white/10">
                    {rooms.filter(r => r.status === 'available').map(room => (
                      <SelectItem key={room.id} value={room.id} className="text-[#F8FAFC] hover:bg-white/5">
                        Quarto {room.number} - {getRoomTypeName(room.room_type_id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Check-in</Label>
                  <Input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                    data-testid="checkin-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Check-out</Label>
                  <Input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                    data-testid="checkout-date-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Adultos</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                    data-testid="adults-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Crianças</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                    data-testid="children-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Valor Total (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) }))}
                  className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                  data-testid="amount-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] min-h-[80px]"
                  placeholder="Observações especiais..."
                  data-testid="notes-textarea"
                />
              </div>

              <Button
                onClick={handleCreateReservation}
                disabled={creating || !formData.guest_id || !formData.room_id || !formData.check_in_date || !formData.check_out_date}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold"
                data-testid="create-reservation-btn"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Criar Reserva'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input
            placeholder="Buscar por hóspede ou quarto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#151E32]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 bg-[#151E32]/50 border-white/10 text-[#F8FAFC]" data-testid="status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#151E32] border-white/10">
            <SelectItem value="all" className="text-[#F8FAFC] hover:bg-white/5">Todos</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key} className="text-[#F8FAFC] hover:bg-white/5">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reservations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#151E32]/50 border-white/5 animate-pulse">
              <CardContent className="p-6 h-48" />
            </Card>
          ))}
        </div>
      ) : filteredReservations.length === 0 ? (
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
            <p className="text-[#94A3B8]">Nenhuma reserva encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((reservation) => {
            const status = statusConfig[reservation.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const paymentStatus = paymentStatusConfig[reservation.payment_status] || paymentStatusConfig.pending;
            
            return (
              <Card 
                key={reservation.id} 
                className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300"
                data-testid={`reservation-card-${reservation.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`${status.color} border px-2 py-1 text-xs font-medium`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                    <span className={`text-xs font-medium ${paymentStatus.color}`}>
                      {paymentStatus.label}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#F8FAFC]">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-medium">{getGuestName(reservation.guest_id)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      <BedDouble className="w-4 h-4" />
                      <span className="text-sm">Quarto {getRoomNumber(reservation.room_id)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(reservation.check_in_date).toLocaleDateString('pt-BR')} - {new Date(reservation.check_out_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[#F8FAFC]">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">
                        R$ {reservation.total_amount?.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      data-testid={`view-reservation-${reservation.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
