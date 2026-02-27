import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Check, 
  Star, 
  Zap, 
  Building2, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Crown,
  Shield,
  Users,
  BarChart3,
  Globe,
  Headphones
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SubscriptionManagementPage = () => {
  const { token, currentHotel, user, isPlatformAdmin } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [allSubscriptions, setAllSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/plans`);
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }, []);

  const fetchCurrentSubscription = useCallback(async () => {
    if (!currentHotel?.id) return;
    
    try {
      const response = await axios.get(`${API}/subscriptions/${currentHotel.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, [token, currentHotel]);

  const fetchAllSubscriptions = useCallback(async () => {
    if (!isPlatformAdmin) return;
    
    try {
      const response = await axios.get(`${API}/platform/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching all subscriptions:', error);
    }
  }, [token, isPlatformAdmin]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlans(),
        fetchCurrentSubscription(),
        fetchAllSubscriptions()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPlans, fetchCurrentSubscription, fetchAllSubscriptions]);

  const handleSubscribe = async () => {
    if (!selectedPlan || !currentHotel?.id) return;
    
    setProcessing(true);
    try {
      await axios.post(`${API}/subscriptions/subscribe`, {
        hotel_id: currentHotel.id,
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle,
        payment_method: 'credit_card'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowConfirmModal(false);
      fetchCurrentSubscription();
      fetchAllSubscriptions();
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!currentHotel?.id) return;
    
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) return;
    
    try {
      await axios.post(`${API}/subscriptions/${currentHotel.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCurrentSubscription();
    } catch (error) {
      console.error('Error cancelling:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getPlanIcon = (planId) => {
    const icons = {
      starter: Star,
      professional: Zap,
      enterprise: Crown
    };
    return icons[planId] || Star;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gold animate-pulse">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-playfair text-white flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-gold" />
          Gestão de Assinaturas
        </h1>
        <p className="text-slate-400 mt-1">Gerencie o plano da sua conta Hestia</p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className={`p-6 rounded-xl border ${
          currentSubscription.subscription?.status === 'active' 
            ? 'bg-emerald-500/10 border-emerald-500/20' 
            : currentSubscription.subscription?.status === 'trial'
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-slate-500/10 border-slate-500/20'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`w-5 h-5 ${
                  currentSubscription.subscription?.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                }`} />
                <span className="text-white font-semibold">
                  Plano Atual: {currentSubscription.subscription?.plan?.charAt(0).toUpperCase() + currentSubscription.subscription?.plan?.slice(1) || 'Trial'}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {currentSubscription.subscription?.status === 'trial' 
                  ? `Período de teste - ${currentSubscription.subscription?.days_remaining || 14} dias restantes`
                  : currentSubscription.subscription?.status === 'active'
                  ? `Ativo até ${currentSubscription.subscription?.end_date || 'N/A'}`
                  : currentSubscription.subscription?.message || 'Status desconhecido'
                }
              </p>
            </div>
            {currentSubscription.has_subscription && currentSubscription.subscription?.status === 'active' && (
              <div className="text-right">
                <div className="text-2xl font-playfair text-white">
                  {formatCurrency(currentSubscription.subscription?.monthly_price)}/mês
                </div>
                <button
                  onClick={handleCancel}
                  className="text-sm text-red-400 hover:text-red-300 mt-2"
                >
                  Cancelar assinatura
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Mensal</span>
        <button
          onClick={() => setBillingCycle(b => b === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-14 h-7 bg-velvet rounded-full border border-white/10"
        >
          <div className={`absolute top-1 w-5 h-5 bg-gold rounded-full transition-all ${
            billingCycle === 'annual' ? 'left-8' : 'left-1'
          }`} />
        </button>
        <span className={`text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
          Anual <span className="text-emerald-400">(17% off)</span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.id);
          const isCurrentPlan = currentSubscription?.subscription?.plan === plan.id;
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual;
          
          return (
            <div
              key={plan.id}
              className={`relative bg-velvet/50 border rounded-xl p-6 transition-all ${
                plan.popular ? 'border-gold/50 scale-105' : 'border-white/10'
              } ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-obsidian text-xs font-semibold px-3 py-1 rounded-full">
                  Mais Popular
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Plano Atual
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  plan.id === 'enterprise' ? 'bg-gold/20' : 
                  plan.id === 'professional' ? 'bg-blue-500/20' : 'bg-slate-500/20'
                }`}>
                  <PlanIcon className={`w-6 h-6 ${
                    plan.id === 'enterprise' ? 'text-gold' : 
                    plan.id === 'professional' ? 'text-blue-400' : 'text-slate-300'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.recommended_for}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-playfair text-white">
                  {formatCurrency(price)}
                  <span className="text-sm text-slate-400 font-sans">
                    /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="text-sm text-emerald-400">
                    Economia de {formatCurrency(plan.price_monthly * 12 - plan.price_annual)}/ano
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowConfirmModal(true);
                }}
                disabled={isCurrentPlan}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isCurrentPlan 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : plan.popular 
                    ? 'bg-gold text-obsidian hover:bg-gold/90'
                    : 'bg-velvet border border-white/20 text-white hover:bg-velvet/80'
                }`}
              >
                {isCurrentPlan ? 'Plano Atual' : 'Selecionar Plano'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Platform Admin - All Subscriptions */}
      {isPlatformAdmin && allSubscriptions && (
        <div className="mt-12 pt-8 border-t border-white/10">
          <h2 className="text-xl font-playfair text-white mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-gold" />
            Todas as Assinaturas (Admin)
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="text-2xl font-semibold text-emerald-400">{allSubscriptions.summary.active}</div>
              <div className="text-sm text-slate-400">Ativos</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="text-2xl font-semibold text-amber-400">{allSubscriptions.summary.trial}</div>
              <div className="text-sm text-slate-400">Em Trial</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="text-2xl font-semibold text-red-400">{allSubscriptions.summary.cancelled}</div>
              <div className="text-sm text-slate-400">Cancelados</div>
            </div>
            <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
              <div className="text-2xl font-semibold text-gold">{formatCurrency(allSubscriptions.total_mrr)}</div>
              <div className="text-sm text-slate-400">MRR Total</div>
            </div>
          </div>

          {/* Subscriptions Table */}
          {allSubscriptions.subscriptions.length > 0 ? (
            <div className="bg-velvet/50 border border-white/5 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-obsidian/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Hotel</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Plano</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Mensalidade</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Vencimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allSubscriptions.subscriptions.map(sub => (
                    <tr key={sub.id} className="hover:bg-obsidian/30">
                      <td className="px-6 py-4">
                        <div className="text-white">{sub.hotel_name || sub.razao_social}</div>
                        <div className="text-xs text-slate-400">{sub.cnpj}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sub.plano_assinatura === 'enterprise' ? 'bg-gold/20 text-gold' :
                          sub.plano_assinatura === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {sub.plano_assinatura?.charAt(0).toUpperCase() + sub.plano_assinatura?.slice(1) || 'Trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sub.status_contrato === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          sub.status_contrato === 'trial' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {sub.status_contrato || 'Trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {formatCurrency(sub.valor_mensalidade)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {sub.data_fim_contrato || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Nenhuma assinatura encontrada
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      <div className="bg-velvet/30 border border-white/5 rounded-xl p-6 mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Perguntas Frequentes</h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-white font-medium">Posso trocar de plano a qualquer momento?</div>
            <div className="text-slate-400">Sim! Você pode fazer upgrade ou downgrade quando quiser. O valor será ajustado proporcionalmente.</div>
          </div>
          <div>
            <div className="text-white font-medium">Existe período de fidelidade?</div>
            <div className="text-slate-400">Não. Você pode cancelar sua assinatura a qualquer momento sem multas.</div>
          </div>
          <div>
            <div className="text-white font-medium">Como funciona o período de teste?</div>
            <div className="text-slate-400">Você tem 14 dias para testar todas as funcionalidades do plano Professional gratuitamente.</div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-velvet rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-playfair text-white mb-4">Confirmar Assinatura</h2>
            
            <div className="bg-obsidian/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Plano</span>
                <span className="text-white font-semibold">{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Ciclo</span>
                <span className="text-white">{billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-slate-400">Total</span>
                <span className="text-gold text-xl font-playfair">
                  {formatCurrency(billingCycle === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_annual)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubscribe}
                disabled={processing}
                className="flex-1 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementPage;
