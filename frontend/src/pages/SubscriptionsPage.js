import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Package, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Sparkles,
  Truck,
  Percent,
  CreditCard,
  Clock,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  AlertTriangle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BILLING_CYCLES = {
  weekly: { label: 'Semanal', days: 7 },
  biweekly: { label: 'Quinzenal', days: 14 },
  monthly: { label: 'Mensal', days: 30 },
  quarterly: { label: 'Trimestral', days: 90 }
};

const STATUS_CONFIG = {
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  paused: { label: 'Pausada', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: PauseCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  expired: { label: 'Expirada', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock }
};

const SubscriptionsPage = () => {
  const { token, currentHotel } = useAuth();
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('faturado');

  const hotelId = currentHotel?.id;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch(`${API_URL}/api/subscriptions/plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPlan = async () => {
    if (!selectedPlan) return;
    
    try {
      const response = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          hotel_id: hotelId,
          payment_method: paymentMethod
        })
      });

      if (response.ok) {
        toast.success('Assinatura criada com sucesso!');
        setSubscribeOpen(false);
        setSelectedPlan(null);
        loadData();
        setActiveTab('subscriptions');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erro ao criar assinatura');
      }
    } catch (error) {
      toast.error('Erro ao criar assinatura');
    }
  };

  const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/${subscriptionId}/status?status=${newStatus}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`Assinatura ${newStatus === 'active' ? 'ativada' : newStatus === 'paused' ? 'pausada' : 'cancelada'}`);
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao atualizar assinatura');
    }
  };

  const openSubscribe = (plan) => {
    setSelectedPlan(plan);
    setSubscribeOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="subscriptions-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-[#D4AF37]" />
            Assinaturas
          </h1>
          <p className="text-[#94A3B8] mt-1">
            Gerencie suas assinaturas e planos recorrentes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[#94A3B8]">Planos Disponíveis</p>
                <p className="text-xl font-bold text-[#F8FAFC]">{plans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-[#94A3B8]">Assinaturas Ativas</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {subscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-[#94A3B8]">Próxima Cobrança</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {subscriptions.find(s => s.status === 'active')?.next_billing_date 
                    ? new Date(subscriptions.find(s => s.status === 'active').next_billing_date).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Percent className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm text-[#94A3B8]">Economia Média</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {plans.length > 0 
                    ? Math.round(plans.reduce((sum, p) => sum + (p.discount_percent || 0), 0) / plans.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#151E32]/50 border border-white/5">
          <TabsTrigger value="plans" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Package className="w-4 h-4 mr-2" />
            Planos Disponíveis
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <RefreshCw className="w-4 h-4 mr-2" />
            Minhas Assinaturas
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.length === 0 ? (
              <Card className="col-span-full bg-[#151E32]/50 border-white/5">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhum plano disponível
                  </h3>
                  <p className="text-[#94A3B8]">
                    Os planos de assinatura serão exibidos aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/30 transition-all flex flex-col"
                  data-testid={`plan-${plan.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      {plan.discount_percent > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          -{plan.discount_percent}%
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-[#F8FAFC] mt-4">{plan.name}</CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="mb-4">
                      {plan.regular_price && (
                        <p className="text-sm text-[#94A3B8] line-through">
                          R$ {plan.regular_price?.toLocaleString('pt-BR')}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#D4AF37]">
                          R$ {plan.subscription_price?.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-sm text-[#94A3B8]">
                          /{BILLING_CYCLES[plan.billing_cycle]?.label?.toLowerCase() || 'mês'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                        <Calendar className="w-4 h-4" />
                        <span>Entrega {BILLING_CYCLES[plan.billing_cycle]?.label}</span>
                      </div>
                      {plan.free_shipping && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Truck className="w-4 h-4" />
                          <span>Frete Grátis</span>
                        </div>
                      )}
                      {plan.priority_delivery && (
                        <div className="flex items-center gap-2 text-sm text-[#D4AF37]">
                          <Sparkles className="w-4 h-4" />
                          <span>Entrega Prioritária</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => openSubscribe(plan)}
                      className="w-full bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                      data-testid={`subscribe-${plan.id}`}
                    >
                      Assinar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-[#F8FAFC]">Minhas Assinaturas</CardTitle>
              <CardDescription className="text-[#94A3B8]">
                Gerencie suas assinaturas ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhuma assinatura ativa
                  </h3>
                  <p className="text-[#94A3B8] mb-4">
                    Assine um plano para receber seus produtos automaticamente
                  </p>
                  <Button 
                    onClick={() => setActiveTab('plans')}
                    className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                  >
                    Ver Planos
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => {
                    const statusConfig = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.active;
                    const StatusIcon = statusConfig.icon;
                    const plan = subscription.subscription_plans || {};
                    
                    return (
                      <div 
                        key={subscription.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/50 border border-white/5"
                        data-testid={`subscription-${subscription.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                            <Package className="w-6 h-6 text-[#D4AF37]" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#F8FAFC]">{plan.name || 'Plano'}</h4>
                            <p className="text-sm text-[#94A3B8]">
                              {BILLING_CYCLES[plan.billing_cycle]?.label || 'Mensal'} • 
                              R$ {plan.subscription_price?.toLocaleString('pt-BR') || '0'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-[#94A3B8]">Próxima Cobrança</p>
                            <p className="text-[#F8FAFC] font-medium">
                              {subscription.next_billing_date 
                                ? new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')
                                : '-'}
                            </p>
                          </div>
                          
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          
                          <div className="flex gap-2">
                            {subscription.status === 'active' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                                  onClick={() => updateSubscriptionStatus(subscription.id, 'paused')}
                                >
                                  <PauseCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  onClick={() => updateSubscriptionStatus(subscription.id, 'cancelled')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {subscription.status === 'paused' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                onClick={() => updateSubscriptionStatus(subscription.id, 'active')}
                              >
                                <PlayCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscribe Dialog */}
      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              Confirmar Assinatura
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Revise os detalhes da assinatura
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-[#0B1120]/50 border border-white/5">
                <h4 className="font-semibold text-[#F8FAFC] mb-2">{selectedPlan.name}</h4>
                <p className="text-sm text-[#94A3B8] mb-4">{selectedPlan.description}</p>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    R$ {selectedPlan.subscription_price?.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-sm text-[#94A3B8]">
                    /{BILLING_CYCLES[selectedPlan.billing_cycle]?.label?.toLowerCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-[#94A3B8]">Forma de Pagamento</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151E32] border-white/10">
                    <SelectItem value="faturado">Faturado (Boleto Mensal)</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">
                  A primeira cobrança será realizada imediatamente. Você pode cancelar a assinatura a qualquer momento.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSubscribeOpen(false)}
                  className="border-white/10"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={subscribeToPlan}
                  className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                  data-testid="confirm-subscription"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
