import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Smartphone, 
  Wifi, 
  Coffee, 
  Bell, 
  MessageSquare,
  Utensils,
  Sparkles,
  Car,
  Loader2,
  Star,
  Clock,
  CheckCircle2,
  MapPin,
  Calendar,
  CreditCard,
  Crown,
  Gift
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SERVICES = [
  { id: 'room_service', name: 'Room Service', icon: Utensils, description: 'Refeições no quarto', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'spa', name: 'Spa & Wellness', icon: Sparkles, description: 'Tratamentos e massagens', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'concierge', name: 'Concierge', icon: Bell, description: 'Assistência personalizada', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'transport', name: 'Transporte', icon: Car, description: 'Transfer e táxi', color: 'text-green-400', bg: 'bg-green-500/20' },
  { id: 'laundry', name: 'Lavanderia', icon: Coffee, description: 'Serviço de lavagem', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { id: 'maintenance', name: 'Manutenção', icon: Wifi, description: 'Problemas no quarto', color: 'text-red-400', bg: 'bg-red-500/20' }
];

const MobileGuestPage = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simulated guest data for demo
  const guestId = user?.id;

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // In production, this would fetch real guest data
      // For demo, we'll show a simulated interface
      setDashboard({
        guest: {
          name: user?.name || 'Hóspede',
          email: user?.email,
          room: '501',
          check_in: '2025-03-15',
          check_out: '2025-03-18'
        },
        reservation: {
          confirmation_code: 'HES37932F',
          room_type: 'Suite Deluxe Vista Mar',
          status: 'checked_in',
          total: 4500
        },
        loyalty: {
          tier: 'Gold',
          points: 3500,
          nights_to_next: 5
        },
        notifications: [
          { message: 'Bem-vindo ao Grand Hestia Palace!', time: '10:00' },
          { message: 'Seu quarto está pronto para check-in', time: '14:00' }
        ]
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!selectedService || !requestDetails) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/mobile/guest/request`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guest_id: guestId,
          room_id: dashboard?.guest?.room,
          type: selectedService.id,
          details: requestDetails
        })
      });

      if (response.ok) {
        toast.success('Solicitação enviada! Responderemos em breve.');
        setRequestOpen(false);
        setSelectedService(null);
        setRequestDetails('');
      }
    } catch (error) {
      toast.error('Erro ao enviar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] pb-20" data-testid="mobile-guest-page">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#D4AF37]/20 to-transparent p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#94A3B8] text-sm">Bem-vindo(a),</p>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">{dashboard?.guest?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
              {dashboard?.loyalty?.tier}
            </Badge>
          </div>
        </div>

        {/* Room Card */}
        <Card className="bg-[#151E32]/80 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Quarto</p>
                  <p className="text-2xl font-bold text-[#F8FAFC]">{dashboard?.guest?.room}</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Check-in
              </Badge>
            </div>
            <p className="text-[#D4AF37] font-medium mb-3">{dashboard?.reservation?.room_type}</p>
            <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(dashboard?.guest?.check_in).toLocaleDateString('pt-BR')}</span>
              </div>
              <span>→</span>
              <span>{new Date(dashboard?.guest?.check_out).toLocaleDateString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Points */}
      <div className="px-6 -mt-2">
        <Card className="bg-gradient-to-r from-[#D4AF37]/10 to-[#B8960C]/10 border-[#D4AF37]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <p className="text-sm text-[#94A3B8]">Seus Pontos</p>
                  <p className="text-xl font-bold text-[#D4AF37]">
                    {dashboard?.loyalty?.points?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-[#D4AF37]/30 text-[#D4AF37]">
                Resgatar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Serviços</h2>
        <div className="grid grid-cols-3 gap-3">
          {SERVICES.map((service) => {
            const IconComponent = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setRequestOpen(true);
                }}
                className="p-4 rounded-xl bg-[#151E32]/50 border border-white/5 hover:border-white/20 transition-all text-center"
              >
                <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mx-auto mb-2`}>
                  <IconComponent className={`w-6 h-6 ${service.color}`} />
                </div>
                <p className="text-sm text-[#F8FAFC] font-medium">{service.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Ações Rápidas</h2>
        <div className="space-y-3">
          <Card className="bg-[#151E32]/50 border-white/5 hover:border-white/10 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#F8FAFC]">Chat com Recepção</p>
                <p className="text-sm text-[#94A3B8]">Fale diretamente com nossa equipe</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151E32]/50 border-white/5 hover:border-white/10 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#F8FAFC]">Ver Conta</p>
                <p className="text-sm text-[#94A3B8]">Extrato e despesas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151E32]/50 border-white/5 hover:border-white/10 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#F8FAFC]">Late Check-out</p>
                <p className="text-sm text-[#94A3B8]">Solicitar saída tardia</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifications */}
      {dashboard?.notifications?.length > 0 && (
        <div className="px-6 mt-6">
          <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Notificações</h2>
          <div className="space-y-2">
            {dashboard.notifications.map((notif, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#151E32]/50 border border-white/5 flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-[#F8FAFC] flex-1">{notif.message}</span>
                <span className="text-xs text-[#94A3B8]">{notif.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC] max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedService && (
                <>
                  <div className={`w-8 h-8 rounded-lg ${selectedService.bg} flex items-center justify-center`}>
                    <selectedService.icon className={`w-4 h-4 ${selectedService.color}`} />
                  </div>
                  {selectedService.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              {selectedService?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm text-[#94A3B8]">Descreva sua solicitação</label>
              <Textarea 
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                placeholder="Ex: Gostaria de solicitar..."
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC] min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setRequestOpen(false)}
                className="flex-1 border-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={submitRequest}
                className="flex-1 bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                disabled={!requestDetails || submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#151E32] border-t border-white/10 px-6 py-3">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-[#D4AF37]">
            <Smartphone className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#94A3B8]">
            <Utensils className="w-5 h-5" />
            <span className="text-xs">Serviços</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#94A3B8]">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#94A3B8]">
            <Crown className="w-5 h-5" />
            <span className="text-xs">Fidelidade</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileGuestPage;
