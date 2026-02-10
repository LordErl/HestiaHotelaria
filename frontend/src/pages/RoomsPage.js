import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  BedDouble, 
  Filter,
  Sparkles,
  Wrench,
  Ban,
  CheckCircle2,
  Users
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  available: { 
    label: 'Disponível', 
    color: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-400/5 hover:bg-emerald-400/10 border-emerald-400/20'
  },
  occupied: { 
    label: 'Ocupado', 
    color: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
    icon: Users,
    bgColor: 'bg-blue-400/5 hover:bg-blue-400/10 border-blue-400/20'
  },
  cleaning: { 
    label: 'Limpeza', 
    color: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30',
    icon: Sparkles,
    bgColor: 'bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 border-[#D4AF37]/20'
  },
  maintenance: { 
    label: 'Manutenção', 
    color: 'bg-orange-400/20 text-orange-400 border-orange-400/30',
    icon: Wrench,
    bgColor: 'bg-orange-400/5 hover:bg-orange-400/10 border-orange-400/20'
  },
  blocked: { 
    label: 'Bloqueado', 
    color: 'bg-red-400/20 text-red-400 border-red-400/30',
    icon: Ban,
    bgColor: 'bg-red-400/5 hover:bg-red-400/10 border-red-400/20'
  },
};

const RoomsPage = () => {
  const { currentHotel } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');

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

  const getRoomTypePrice = (typeId) => {
    const type = roomTypes.find(t => t.id === typeId);
    return type?.base_price || 0;
  };

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);

  const filteredRooms = rooms.filter(room => {
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
    return matchesStatus && matchesFloor;
  });

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {});

  const statusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});

  if (!currentHotel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#94A3B8]">Selecione um hotel para ver os quartos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="rooms-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Mapa de Quartos</h1>
          <p className="text-[#94A3B8] mt-1">Visualização e controle de status dos quartos</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = statusCounts[key] || 0;
          return (
            <Badge 
              key={key}
              className={`${config.color} border px-3 py-1.5 text-xs font-medium cursor-pointer transition-all
                ${statusFilter === key ? 'ring-2 ring-offset-2 ring-offset-[#0B1120]' : ''}`}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              data-testid={`status-badge-${key}`}
            >
              <Icon className="w-3 h-3 mr-1.5" />
              {config.label}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-[#151E32]/50 border-white/10 text-[#F8FAFC]" data-testid="status-filter">
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

        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-48 bg-[#151E32]/50 border-white/10 text-[#F8FAFC]" data-testid="floor-filter">
            <SelectValue placeholder="Andar" />
          </SelectTrigger>
          <SelectContent className="bg-[#151E32] border-white/10">
            <SelectItem value="all" className="text-[#F8FAFC] hover:bg-white/5">Todos os Andares</SelectItem>
            {floors.map(floor => (
              <SelectItem key={floor} value={floor.toString()} className="text-[#F8FAFC] hover:bg-white/5">
                {floor}º Andar
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rooms Grid by Floor */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(floor => (
            <div key={floor}>
              <div className="h-6 w-32 bg-[#151E32] rounded animate-pulse mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-40 bg-[#151E32]/50 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(roomsByFloor).length === 0 ? (
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-12 text-center">
            <BedDouble className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
            <p className="text-[#94A3B8]">Nenhum quarto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(roomsByFloor)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([floor, floorRooms]) => (
            <div key={floor} className="space-y-4">
              <h2 className="font-display text-lg text-[#E8DCC4] border-b border-white/10 pb-2">
                {floor}º Andar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {floorRooms.sort((a, b) => a.number.localeCompare(b.number)).map(room => {
                  const status = statusConfig[room.status] || statusConfig.available;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card 
                      key={room.id}
                      className={`${status.bgColor} border transition-all duration-300 cursor-pointer group`}
                      data-testid={`room-card-${room.number}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BedDouble className="w-5 h-5 text-[#94A3B8] group-hover:text-[#D4AF37] transition-colors" />
                            <span className="font-display text-xl font-bold text-[#F8FAFC]">{room.number}</span>
                          </div>
                          <StatusIcon className="w-4 h-4 text-inherit" />
                        </div>
                        
                        <p className="text-xs text-[#94A3B8] mb-2 truncate">
                          {getRoomTypeName(room.room_type_id)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#D4AF37]">
                            R$ {getRoomTypePrice(room.room_type_id).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <Select 
                            value={room.status} 
                            onValueChange={(value) => handleStatusChange(room.id, value)}
                          >
                            <SelectTrigger 
                              className={`w-full h-8 text-xs ${status.color} border-0 bg-transparent`}
                              data-testid={`room-status-select-${room.number}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#151E32] border-white/10">
                              {Object.entries(statusConfig).map(([key, { label, icon: Icon }]) => (
                                <SelectItem key={key} value={key} className="text-[#F8FAFC] hover:bg-white/5">
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-3 h-3" />
                                    {label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default RoomsPage;
