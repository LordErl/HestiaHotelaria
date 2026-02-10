import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Crown,
  User,
  Calendar,
  BedDouble,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Star,
  Send,
  Loader2,
  Coffee,
  Utensils,
  Wifi,
  Car,
  Sparkles,
  ChevronRight,
  Home,
  History
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuestPortalPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [guestData, setGuestData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou Jarbas, seu mordomo digital. Como posso tornar sua estadia mais agradável hoje?' }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', confirmation_code: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/guest-portal/login`, loginData);
      setGuestData(response.data.guest);
      setReservations(response.data.reservations);
      setCurrentReservation(response.data.current_reservation);
      setHotel(response.data.hotel);
      setIsLoggedIn(true);
      localStorage.setItem('guest_token', response.data.token);
    } catch (error) {
      setLoginError(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;

    const userMessage = { role: 'user', content: messageInput };
    setChatMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setSendingMessage(true);

    try {
      const response = await axios.post(`${API}/guest-portal/chat`, {
        message: messageInput,
        session_id: sessionId,
        guest_id: guestData?.id
      });
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      setSessionId(response.data.session_id);
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, houve um erro. Por favor, tente novamente.' 
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setGuestData(null);
    setReservations([]);
    setCurrentReservation(null);
    localStorage.removeItem('guest_token');
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendente', color: 'bg-orange-400/20 text-orange-400 border-orange-400/30' },
      confirmed: { label: 'Confirmada', color: 'bg-blue-400/20 text-blue-400 border-blue-400/30' },
      checked_in: { label: 'Hospedado', color: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30' },
      checked_out: { label: 'Finalizada', color: 'bg-[#94A3B8]/20 text-[#94A3B8] border-[#94A3B8]/30' },
      cancelled: { label: 'Cancelada', color: 'bg-red-400/20 text-red-400 border-red-400/30' },
    };
    const statusConfig = config[status] || config.pending;
    return <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#151E32] border border-[#D4AF37]/30 mb-4 gold-glow">
              <Crown className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h1 className="font-display text-4xl font-bold text-[#F8FAFC] tracking-tight">Portal do Hóspede</h1>
            <p className="text-[#94A3B8] mt-2">Acesse sua reserva e serviços exclusivos</p>
          </div>

          <Card className="bg-[#151E32]/80 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl text-[#F8FAFC]">Acessar Reserva</CardTitle>
              <CardDescription className="text-[#94A3B8]">
                Use seu email e código de confirmação
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      className="pl-10 bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                      required
                      data-testid="guest-login-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Código da Reserva</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      value={loginData.confirmation_code}
                      onChange={(e) => setLoginData(prev => ({ ...prev, confirmation_code: e.target.value.toUpperCase() }))}
                      placeholder="ABC12345"
                      className="pl-10 bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] uppercase"
                      required
                      data-testid="guest-login-code"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-red-400 text-sm text-center">{loginError}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold py-6"
                  data-testid="guest-login-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Acessar'}
                </Button>

                <div className="text-center">
                  <a href="/booking" className="text-[#D4AF37] hover:underline text-sm">
                    Ainda não tem reserva? Faça agora
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]" data-testid="guest-portal">
      {/* Header */}
      <header className="bg-[#151E32]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-[#F8FAFC]">{hotel?.name || 'Hestia'}</h1>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Portal do Hóspede</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-[#D4AF37]">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 border border-[#D4AF37]/30">
                  <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                    {guestData?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-[#F8FAFC]">{guestData?.name}</p>
                  <p className="text-xs text-[#94A3B8]">Hóspede</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-[#94A3B8] hover:text-red-400"
                data-testid="guest-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Reservation Banner */}
            {currentReservation && (
              <Card className="bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Reserva Ativa</span>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mb-1">
                        Bem-vindo, {guestData?.name?.split(' ')[0]}!
                      </h2>
                      <p className="text-[#94A3B8]">
                        Quarto {currentReservation.room_number} • {currentReservation.room_type_name}
                      </p>
                    </div>
                    {getStatusBadge(currentReservation.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-[#0B1120]/30 rounded-lg p-3">
                      <p className="text-xs text-[#94A3B8] uppercase">Check-in</p>
                      <p className="text-[#F8FAFC] font-semibold">
                        {format(new Date(currentReservation.check_in_date), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="bg-[#0B1120]/30 rounded-lg p-3">
                      <p className="text-xs text-[#94A3B8] uppercase">Check-out</p>
                      <p className="text-[#F8FAFC] font-semibold">
                        {format(new Date(currentReservation.check_out_date), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="bg-[#0B1120]/30 rounded-lg p-3">
                      <p className="text-xs text-[#94A3B8] uppercase">Quarto</p>
                      <p className="text-[#F8FAFC] font-semibold">{currentReservation.room_number}</p>
                    </div>
                    <div className="bg-[#0B1120]/30 rounded-lg p-3">
                      <p className="text-xs text-[#94A3B8] uppercase">Hóspedes</p>
                      <p className="text-[#F8FAFC] font-semibold">
                        {currentReservation.adults + currentReservation.children}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Coffee, label: 'Room Service', desc: 'Peça agora' },
                { icon: Sparkles, label: 'Housekeeping', desc: 'Solicitar' },
                { icon: Car, label: 'Transporte', desc: 'Reservar' },
                { icon: Utensils, label: 'Restaurante', desc: 'Ver cardápio' },
              ].map((action, i) => (
                <Card 
                  key={i} 
                  className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 cursor-pointer transition-all duration-300 group"
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mb-3 group-hover:bg-[#D4AF37]/20 transition-colors">
                      <action.icon className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <h4 className="font-semibold text-[#F8FAFC] text-sm">{action.label}</h4>
                    <p className="text-xs text-[#94A3B8]">{action.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[#151E32]/50 border border-white/10 p-1">
                <TabsTrigger 
                  value="current" 
                  className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120]"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Atual
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120]"
                >
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4">
                {currentReservation ? (
                  <Card className="bg-[#151E32]/50 border-white/5">
                    <CardHeader>
                      <CardTitle className="font-display text-lg text-[#F8FAFC]">Detalhes da Estadia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase mb-1">Acomodação</p>
                          <p className="text-[#F8FAFC]">{currentReservation.room_type_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase mb-1">Número do Quarto</p>
                          <p className="text-[#F8FAFC]">{currentReservation.room_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase mb-1">Valor Total</p>
                          <p className="text-[#D4AF37] font-semibold">
                            R$ {currentReservation.total_amount?.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase mb-1">Status Pagamento</p>
                          <p className={currentReservation.payment_status === 'paid' ? 'text-emerald-400' : 'text-orange-400'}>
                            {currentReservation.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                          </p>
                        </div>
                      </div>

                      {currentReservation.notes && (
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-xs text-[#94A3B8] uppercase mb-1">Observações</p>
                          <p className="text-[#F8FAFC] text-sm">{currentReservation.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-[#151E32]/50 border-white/5">
                    <CardContent className="p-12 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
                      <p className="text-[#F8FAFC] font-semibold">Nenhuma reserva ativa</p>
                      <p className="text-[#94A3B8] mt-2">Faça uma nova reserva para acessar os serviços do hotel.</p>
                      <Button className="mt-4 bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120]">
                        Nova Reserva
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card className="bg-[#151E32]/50 border-white/5">
                  <CardHeader>
                    <CardTitle className="font-display text-lg text-[#F8FAFC]">Histórico de Reservas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reservations.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
                        <p className="text-[#94A3B8]">Nenhuma reserva anterior</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reservations.map((res, i) => (
                          <div 
                            key={i}
                            className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/30 hover:bg-[#0B1120]/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                                <BedDouble className="w-5 h-5 text-[#D4AF37]" />
                              </div>
                              <div>
                                <p className="text-[#F8FAFC] font-semibold">{res.room_type_name}</p>
                                <p className="text-xs text-[#94A3B8]">
                                  {format(new Date(res.check_in_date), 'dd/MM/yyyy')} - {format(new Date(res.check_out_date), 'dd/MM/yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(res.status)}
                              <p className="text-[#D4AF37] font-semibold mt-1">
                                R$ {res.total_amount?.toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Chat with Jarbas */}
          <div className="space-y-6">
            <Card className="bg-[#151E32]/50 border-white/5 h-[600px] flex flex-col">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg text-[#F8FAFC]">Jarbas</CardTitle>
                    <CardDescription className="text-[#94A3B8]">Seu mordomo digital</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-[#D4AF37]/20 text-[#F8FAFC] border border-[#D4AF37]/30'
                          : 'bg-[#0B1120]/50 text-[#F8FAFC] border border-white/10'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sendingMessage && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="bg-[#0B1120]/50 border border-white/10 rounded-lg px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-[#0B1120]/50 border-white/10 text-[#F8FAFC]"
                    data-testid="jarbas-input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120]"
                    data-testid="jarbas-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Hotel Info Card */}
            {hotel && (
              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-[#F8FAFC]">{hotel.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      <MapPin className="w-4 h-4" />
                      <span>{hotel.address}</span>
                    </div>
                    {hotel.phone && (
                      <div className="flex items-center gap-2 text-[#94A3B8]">
                        <Phone className="w-4 h-4" />
                        <span>{hotel.phone}</span>
                      </div>
                    )}
                    {hotel.email && (
                      <div className="flex items-center gap-2 text-[#94A3B8]">
                        <Mail className="w-4 h-4" />
                        <span>{hotel.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuestPortalPage;
