import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Sparkles, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  BedDouble,
  Filter
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const priorityConfig = {
  high: { label: 'Alta', color: 'bg-red-400/20 text-red-400 border-red-400/30' },
  medium: { label: 'Média', color: 'bg-orange-400/20 text-orange-400 border-orange-400/30' },
  low: { label: 'Baixa', color: 'bg-blue-400/20 text-blue-400 border-blue-400/30' },
};

const HousekeepingPage = () => {
  const { currentHotel } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!currentHotel) return;
    
    try {
      setLoading(true);
      const [roomsRes, typesRes] = await Promise.all([
        axios.get(`${API}/rooms?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/room-types?hotel_id=${currentHotel.id}`)
      ]);
      
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

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await axios.patch(`${API}/rooms/${roomId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const getRoomTypeName = (typeId) => {
    const type = roomTypes.find(t => t.id === typeId);
    return type?.name || 'N/A';
  };

  // Housekeeping queue - rooms needing attention
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance');

  // Determine priority based on status and other factors
  const getPriority = (room) => {
    if (room.status === 'cleaning') return 'high';
    if (room.status === 'maintenance') return 'medium';
    return 'low';
  };

  const sortedCleaningRooms = [...cleaningRooms].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[getPriority(a)] - priorityOrder[getPriority(b)];
  });

  const statusCounts = {
    cleaning: cleaningRooms.length,
    maintenance: maintenanceRooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
  };

  if (!currentHotel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#94A3B8]">Selecione um hotel para acessar Housekeeping.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="housekeeping-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Housekeeping</h1>
        <p className="text-[#94A3B8] mt-1">Gestão de limpeza e manutenção de quartos</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#D4AF37]/10 border-[#D4AF37]/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{statusCounts.cleaning}</p>
              <p className="text-sm text-[#94A3B8]">Para Limpar</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-400/10 border-orange-400/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-400/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{statusCounts.maintenance}</p>
              <p className="text-sm text-[#94A3B8]">Manutenção</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-400/10 border-emerald-400/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-400/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{statusCounts.available}</p>
              <p className="text-sm text-[#94A3B8]">Disponíveis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-400/10 border-blue-400/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-400/20 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F8FAFC]">{statusCounts.occupied}</p>
              <p className="text-sm text-[#94A3B8]">Ocupados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-[#151E32]/50 border-white/10 text-[#F8FAFC]" data-testid="housekeeping-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent className="bg-[#151E32] border-white/10">
            <SelectItem value="all" className="text-[#F8FAFC] hover:bg-white/5">Todos Pendentes</SelectItem>
            <SelectItem value="cleaning" className="text-[#F8FAFC] hover:bg-white/5">Apenas Limpeza</SelectItem>
            <SelectItem value="maintenance" className="text-[#F8FAFC] hover:bg-white/5">Apenas Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Queue */}
      <div className="space-y-4">
        <h2 className="font-display text-lg text-[#E8DCC4]">Fila de Tarefas</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-[#151E32]/50 border-white/5 animate-pulse">
                <CardContent className="p-6 h-40" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Cleaning Queue */}
            {(statusFilter === 'all' || statusFilter === 'cleaning') && sortedCleaningRooms.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  Limpeza Pendente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedCleaningRooms.map(room => {
                    const priority = getPriority(room);
                    const priorityStyle = priorityConfig[priority];
                    
                    return (
                      <Card 
                        key={room.id}
                        className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300"
                        data-testid={`housekeeping-room-${room.number}`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <BedDouble className="w-5 h-5 text-[#D4AF37]" />
                              <span className="font-display text-xl font-bold text-[#F8FAFC]">{room.number}</span>
                            </div>
                            <Badge className={`${priorityStyle.color} border text-xs`}>
                              {priorityStyle.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-[#94A3B8] mb-4">{getRoomTypeName(room.room_type_id)}</p>
                          
                          <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-4">
                            <Clock className="w-3 h-3" />
                            <span>Aguardando limpeza</span>
                          </div>
                          
                          <Button
                            onClick={() => handleStatusChange(room.id, 'available')}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm"
                            data-testid={`complete-cleaning-${room.number}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Marcar como Limpo
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Maintenance Queue */}
            {(statusFilter === 'all' || statusFilter === 'maintenance') && maintenanceRooms.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Manutenção Pendente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {maintenanceRooms.map(room => (
                    <Card 
                      key={room.id}
                      className="bg-[#151E32]/50 border-orange-400/20 hover:border-orange-400/40 transition-all duration-300"
                      data-testid={`maintenance-room-${room.number}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BedDouble className="w-5 h-5 text-orange-400" />
                            <span className="font-display text-xl font-bold text-[#F8FAFC]">{room.number}</span>
                          </div>
                          <Badge className="bg-orange-400/20 text-orange-400 border-orange-400/30 border text-xs">
                            Manutenção
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-[#94A3B8] mb-4">{getRoomTypeName(room.room_type_id)}</p>
                        
                        {room.notes && (
                          <p className="text-xs text-[#94A3B8] italic mb-4 bg-white/5 p-2 rounded">
                            {room.notes}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStatusChange(room.id, 'cleaning')}
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-white/5 text-[#94A3B8] text-sm"
                            data-testid={`send-cleaning-${room.number}`}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Limpeza
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(room.id, 'available')}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                            data-testid={`complete-maintenance-${room.number}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Concluído
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {sortedCleaningRooms.length === 0 && maintenanceRooms.length === 0 && (
              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                  <p className="text-[#F8FAFC] font-semibold mb-2">Tudo em ordem!</p>
                  <p className="text-[#94A3B8]">Não há tarefas pendentes de housekeeping.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HousekeepingPage;
