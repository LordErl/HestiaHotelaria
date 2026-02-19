import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Plus, 
  Building2, 
  Users, 
  Clock, 
  DollarSign,
  MapPin,
  Loader2,
  Search,
  Maximize2,
  PartyPopper,
  Briefcase,
  Heart,
  Mic2,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EVENT_TYPES = {
  corporativo: { label: 'Corporativo', icon: Briefcase, color: 'text-blue-400' },
  casamento: { label: 'Casamento', icon: Heart, color: 'text-pink-400' },
  aniversario: { label: 'Aniversário', icon: PartyPopper, color: 'text-yellow-400' },
  conferencia: { label: 'Conferência', icon: Mic2, color: 'text-purple-400' },
  workshop: { label: 'Workshop', icon: Users, color: 'text-green-400' }
};

const STATUS_CONFIG = {
  inquiry: { label: 'Consulta', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  tentative: { label: 'Tentativo', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Concluído', color: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

const EventsManagementPage = () => {
  const { token, currentHotel } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  
  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_type: 'corporativo',
    space_id: '',
    event_date: '',
    start_time: '',
    end_time: '',
    expected_guests: '',
    room_setup: 'theater',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    special_requirements: ''
  });
  
  const [spaceForm, setSpaceForm] = useState({
    name: '',
    space_type: 'sala_reuniao',
    capacity_theater: '',
    capacity_banquet: '',
    area_sqm: '',
    hourly_rate: '',
    half_day_rate: '',
    full_day_rate: '',
    floor: ''
  });

  const hotelId = currentHotel?.id;

  useEffect(() => {
    if (hotelId) {
      loadData();
    }
  }, [hotelId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, spacesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/events/list?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/events/spaces?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/events/stats?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (spacesRes.ok) setSpaces(await spacesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          ...eventForm,
          expected_guests: parseInt(eventForm.expected_guests) || 0
        })
      });

      if (response.ok) {
        toast.success('Evento criado com sucesso');
        setNewEventOpen(false);
        resetEventForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erro ao criar evento');
      }
    } catch (error) {
      toast.error('Erro ao criar evento');
    }
  };

  const createSpace = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events/spaces`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          ...spaceForm,
          capacity_theater: parseInt(spaceForm.capacity_theater) || 0,
          capacity_banquet: parseInt(spaceForm.capacity_banquet) || 0,
          area_sqm: parseFloat(spaceForm.area_sqm) || 0,
          hourly_rate: parseFloat(spaceForm.hourly_rate) || 0,
          half_day_rate: parseFloat(spaceForm.half_day_rate) || 0,
          full_day_rate: parseFloat(spaceForm.full_day_rate) || 0
        })
      });

      if (response.ok) {
        toast.success('Espaço criado com sucesso');
        setNewSpaceOpen(false);
        resetSpaceForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erro ao criar espaço');
      }
    } catch (error) {
      toast.error('Erro ao criar espaço');
    }
  };

  const updateEventStatus = async (eventId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Status atualizado');
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const resetEventForm = () => {
    setEventForm({
      event_name: '',
      event_type: 'corporativo',
      space_id: '',
      event_date: '',
      start_time: '',
      end_time: '',
      expected_guests: '',
      room_setup: 'theater',
      client_name: '',
      client_email: '',
      client_phone: '',
      client_company: '',
      special_requirements: ''
    });
  };

  const resetSpaceForm = () => {
    setSpaceForm({
      name: '',
      space_type: 'sala_reuniao',
      capacity_theater: '',
      capacity_banquet: '',
      area_sqm: '',
      hourly_rate: '',
      half_day_rate: '',
      full_day_rate: '',
      floor: ''
    });
  };

  const filteredEvents = events.filter(event => 
    event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.client_company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && events.length === 0 && spaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="events-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-[#D4AF37]" />
            Eventos & Salas
          </h1>
          <p className="text-[#94A3B8] mt-1">
            Gerencie espaços para eventos e reservas
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setNewSpaceOpen(true)}
            className="border-white/10 text-[#F8FAFC]"
            data-testid="add-space-btn"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Novo Espaço
          </Button>
          <Button 
            onClick={() => setNewEventOpen(true)}
            className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
            data-testid="add-event-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Espaços</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.total_spaces}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Eventos Mês</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.events_this_month}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Confirmados</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.confirmed_events}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Participantes</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.total_expected_guests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Receita Mês</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">
                    R$ {stats.monthly_revenue?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#151E32]/50 border border-white/5">
          <TabsTrigger value="events" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <CalendarDays className="w-4 h-4 mr-2" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="spaces" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Building2 className="w-4 h-4 mr-2" />
            Espaços
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#F8FAFC]">Agenda de Eventos</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    {filteredEvents.length} eventos agendados
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <Input 
                    placeholder="Buscar evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0B1120] border-white/10 text-[#F8FAFC] w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhum evento agendado
                  </h3>
                  <p className="text-[#94A3B8]">
                    Crie o primeiro evento clicando em "Novo Evento"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => {
                    const eventType = EVENT_TYPES[event.event_type] || EVENT_TYPES.corporativo;
                    const EventIcon = eventType.icon;
                    
                    return (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/50 border border-white/5 hover:border-white/10 transition-all"
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center`}>
                            <EventIcon className={`w-6 h-6 ${eventType.color}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#F8FAFC]">{event.event_name}</h4>
                            <p className="text-sm text-[#94A3B8]">
                              {event.client_company || event.client_name} • {event.expected_guests} convidados
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-[#94A3B8]">Data</p>
                            <p className="text-[#F8FAFC] font-medium">
                              {new Date(event.event_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-[#94A3B8]">Horário</p>
                            <p className="text-[#F8FAFC] font-medium">
                              {event.start_time} - {event.end_time}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-[#94A3B8]">Total</p>
                            <p className="text-[#D4AF37] font-medium">
                              R$ {event.total_amount?.toLocaleString('pt-BR') || '-'}
                            </p>
                          </div>
                          
                          <Badge className={STATUS_CONFIG[event.status]?.color || STATUS_CONFIG.inquiry.color}>
                            {STATUS_CONFIG[event.status]?.label || event.status}
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-[#94A3B8]">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#151E32] border-white/10">
                              <DropdownMenuItem 
                                className="text-[#F8FAFC] hover:bg-white/5"
                                onClick={() => updateEventStatus(event.id, 'confirmed')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                                Confirmar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-[#F8FAFC] hover:bg-white/5"
                                onClick={() => updateEventStatus(event.id, 'cancelled')}
                              >
                                <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spaces Tab */}
        <TabsContent value="spaces" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.length === 0 ? (
              <Card className="col-span-full bg-[#151E32]/50 border-white/5">
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhum espaço cadastrado
                  </h3>
                  <p className="text-[#94A3B8]">
                    Cadastre salas de reunião, auditórios e salões de eventos
                  </p>
                </CardContent>
              </Card>
            ) : (
              spaces.map((space) => (
                <Card 
                  key={space.id} 
                  className="bg-[#151E32]/50 border-white/5 hover:border-white/10 transition-all"
                  data-testid={`space-${space.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      <Badge variant="outline" className="text-[#94A3B8] border-white/10">
                        {space.floor ? `${space.floor}º andar` : 'Térreo'}
                      </Badge>
                    </div>
                    <CardTitle className="text-[#F8FAFC] mt-4">{space.name}</CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      {space.space_type === 'sala_reuniao' ? 'Sala de Reunião' :
                       space.space_type === 'auditorio' ? 'Auditório' :
                       space.space_type === 'salao_festas' ? 'Salão de Festas' :
                       'Área Externa'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Capacities */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-[#94A3B8]" />
                        <span className="text-[#94A3B8]">Teatro:</span>
                        <span className="text-[#F8FAFC] font-medium">{space.capacity_theater || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-[#94A3B8]" />
                        <span className="text-[#94A3B8]">Banquete:</span>
                        <span className="text-[#F8FAFC] font-medium">{space.capacity_banquet || '-'}</span>
                      </div>
                    </div>
                    
                    {/* Area */}
                    <div className="flex items-center gap-2 text-sm">
                      <Maximize2 className="w-4 h-4 text-[#94A3B8]" />
                      <span className="text-[#94A3B8]">Área:</span>
                      <span className="text-[#F8FAFC] font-medium">{space.area_sqm} m²</span>
                    </div>
                    
                    {/* Prices */}
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-xs text-[#94A3B8] mb-2">Valores</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-[#0B1120]/50">
                          <p className="text-xs text-[#94A3B8]">Hora</p>
                          <p className="text-sm text-[#D4AF37] font-medium">
                            R$ {space.hourly_rate?.toLocaleString('pt-BR') || '-'}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0B1120]/50">
                          <p className="text-xs text-[#94A3B8]">½ Dia</p>
                          <p className="text-sm text-[#D4AF37] font-medium">
                            R$ {space.half_day_rate?.toLocaleString('pt-BR') || '-'}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0B1120]/50">
                          <p className="text-xs text-[#94A3B8]">Dia</p>
                          <p className="text-sm text-[#D4AF37] font-medium">
                            R$ {space.full_day_rate?.toLocaleString('pt-BR') || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Event Dialog */}
      <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
              Novo Evento
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Agende um novo evento no hotel
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-[#94A3B8]">Nome do Evento *</Label>
              <Input 
                value={eventForm.event_name}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_name: e.target.value }))}
                placeholder="Conferência Anual"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Tipo de Evento *</Label>
              <Select 
                value={eventForm.event_type}
                onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                  <SelectItem value="casamento">Casamento</SelectItem>
                  <SelectItem value="aniversario">Aniversário</SelectItem>
                  <SelectItem value="conferencia">Conferência</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Espaço *</Label>
              <Select 
                value={eventForm.space_id}
                onValueChange={(value) => setEventForm(prev => ({ ...prev, space_id: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Data *</Label>
              <Input 
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Convidados Esperados</Label>
              <Input 
                type="number"
                value={eventForm.expected_guests}
                onChange={(e) => setEventForm(prev => ({ ...prev, expected_guests: e.target.value }))}
                placeholder="100"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Início *</Label>
              <Input 
                type="time"
                value={eventForm.start_time}
                onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Término *</Label>
              <Input 
                type="time"
                value={eventForm.end_time}
                onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Layout da Sala</Label>
              <Select 
                value={eventForm.room_setup}
                onValueChange={(value) => setEventForm(prev => ({ ...prev, room_setup: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  <SelectItem value="theater">Teatro</SelectItem>
                  <SelectItem value="classroom">Auditório</SelectItem>
                  <SelectItem value="banquet">Banquete</SelectItem>
                  <SelectItem value="cocktail">Coquetel</SelectItem>
                  <SelectItem value="u_shape">U</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 pt-4 border-t border-white/5">
              <h4 className="text-sm font-medium text-[#F8FAFC] mb-3">Dados do Contratante</h4>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Nome</Label>
              <Input 
                value={eventForm.client_name}
                onChange={(e) => setEventForm(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="João Silva"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Empresa</Label>
              <Input 
                value={eventForm.client_company}
                onChange={(e) => setEventForm(prev => ({ ...prev, client_company: e.target.value }))}
                placeholder="Empresa XYZ"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Email</Label>
              <Input 
                type="email"
                value={eventForm.client_email}
                onChange={(e) => setEventForm(prev => ({ ...prev, client_email: e.target.value }))}
                placeholder="joao@empresa.com"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Telefone</Label>
              <Input 
                value={eventForm.client_phone}
                onChange={(e) => setEventForm(prev => ({ ...prev, client_phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label className="text-[#94A3B8]">Requisitos Especiais</Label>
              <Textarea 
                value={eventForm.special_requirements}
                onChange={(e) => setEventForm(prev => ({ ...prev, special_requirements: e.target.value }))}
                placeholder="Necessidades específicas, equipamentos, catering..."
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC] min-h-[80px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setNewEventOpen(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={createEvent}
              className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
              disabled={!eventForm.event_name || !eventForm.event_date || !eventForm.start_time || !eventForm.end_time}
              data-testid="save-event-btn"
            >
              Criar Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Space Dialog */}
      <Dialog open={newSpaceOpen} onOpenChange={setNewSpaceOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC] max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#D4AF37]" />
              Novo Espaço
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Cadastre um novo espaço para eventos
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-[#94A3B8]">Nome *</Label>
              <Input 
                value={spaceForm.name}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Salão Nobre"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Tipo *</Label>
              <Select 
                value={spaceForm.space_type}
                onValueChange={(value) => setSpaceForm(prev => ({ ...prev, space_type: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  <SelectItem value="sala_reuniao">Sala de Reunião</SelectItem>
                  <SelectItem value="auditorio">Auditório</SelectItem>
                  <SelectItem value="salao_festas">Salão de Festas</SelectItem>
                  <SelectItem value="area_externa">Área Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Andar</Label>
              <Input 
                value={spaceForm.floor}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, floor: e.target.value }))}
                placeholder="1"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Capacidade Teatro</Label>
              <Input 
                type="number"
                value={spaceForm.capacity_theater}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, capacity_theater: e.target.value }))}
                placeholder="200"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Capacidade Banquete</Label>
              <Input 
                type="number"
                value={spaceForm.capacity_banquet}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, capacity_banquet: e.target.value }))}
                placeholder="150"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Área (m²)</Label>
              <Input 
                type="number"
                value={spaceForm.area_sqm}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, area_sqm: e.target.value }))}
                placeholder="300"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="col-span-2 pt-4 border-t border-white/5">
              <h4 className="text-sm font-medium text-[#F8FAFC] mb-3">Valores</h4>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Por Hora (R$)</Label>
              <Input 
                type="number"
                value={spaceForm.hourly_rate}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, hourly_rate: e.target.value }))}
                placeholder="500"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Meio Período (R$)</Label>
              <Input 
                type="number"
                value={spaceForm.half_day_rate}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, half_day_rate: e.target.value }))}
                placeholder="1500"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label className="text-[#94A3B8]">Dia Inteiro (R$)</Label>
              <Input 
                type="number"
                value={spaceForm.full_day_rate}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, full_day_rate: e.target.value }))}
                placeholder="2500"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setNewSpaceOpen(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={createSpace}
              className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
              disabled={!spaceForm.name}
              data-testid="save-space-btn"
            >
              Criar Espaço
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsManagementPage;
