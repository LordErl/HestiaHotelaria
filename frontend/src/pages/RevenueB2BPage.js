import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  PieChart,
  Target,
  Calendar,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RevenueB2BPage = () => {
  const { token, isPlatformAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/platform/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-playfair text-white mb-2">Acesso Restrito</h1>
          <p className="text-slate-400">Esta página é exclusiva para administradores da plataforma Hestia.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gold animate-pulse">Carregando dados de receita...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Erro ao carregar dados</div>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "gold" }) => {
    const colorClasses = {
      gold: "text-gold bg-gold/10 border-gold/20",
      emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      red: "text-red-400 bg-red-500/10 border-red-500/20"
    };

    return (
      <div className={`bg-velvet/50 border rounded-xl p-6 ${colorClasses[color].split(' ').slice(1).join(' ')}`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color].split(' ')[1]}`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[0]}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-playfair text-white mb-1">{value}</div>
        <div className="text-sm text-slate-400">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-white flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-gold" />
            Dashboard de Receita B2B
          </h1>
          <p className="text-slate-400 mt-1">Métricas financeiras da plataforma Hestia</p>
        </div>
        <button
          onClick={fetchRevenue}
          className="flex items-center gap-2 px-4 py-2 bg-velvet border border-white/10 rounded-lg text-slate-300 hover:bg-velvet/80"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR - Receita Recorrente Mensal"
          value={data.mrr.formatted}
          icon={DollarSign}
          color="gold"
        />
        <MetricCard
          title="ARR - Receita Anual"
          value={data.arr.formatted}
          icon={Calendar}
          color="emerald"
        />
        <MetricCard
          title="Churn Rate"
          value={data.churn.formatted}
          subtitle="Taxa de cancelamento"
          icon={ArrowDownRight}
          color={data.churn.rate > 5 ? "red" : "blue"}
        />
        <MetricCard
          title="ARPU - Receita Média por Hotel"
          value={data.arpu.formatted}
          icon={Target}
          color="purple"
        />
      </div>

      {/* GMV & Commission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-8 h-8 text-gold" />
            <div>
              <h3 className="text-lg font-semibold text-white">GMV - Volume Bruto de Mercadorias</h3>
              <p className="text-sm text-slate-400">Total de transações na plataforma</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-playfair text-white">{data.gmv.formatted_total}</div>
              <div className="text-sm text-slate-400">GMV Total</div>
            </div>
            <div>
              <div className="text-3xl font-playfair text-gold">{data.gmv.formatted_month}</div>
              <div className="text-sm text-slate-400">Este Mês</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-8 h-8 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Comissão da Plataforma</h3>
              <p className="text-sm text-slate-400">10% sobre o GMV</p>
            </div>
          </div>
          <div className="text-4xl font-playfair text-emerald-400">{data.platform_commission.formatted}</div>
          <div className="text-sm text-slate-400 mt-2">Receita de comissões sobre reservas</div>
        </div>
      </div>

      {/* Contracts & Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contracts Status */}
        <div className="bg-velvet/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold" />
            Status dos Contratos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ativos</span>
              <span className="text-2xl font-semibold text-emerald-400">{data.contracts.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Em Trial</span>
              <span className="text-2xl font-semibold text-amber-400">{data.contracts.trial}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cancelados</span>
              <span className="text-2xl font-semibold text-red-400">{data.contracts.cancelled}</span>
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-white font-medium">Total</span>
              <span className="text-2xl font-semibold text-white">{data.contracts.total}</span>
            </div>
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-velvet/50 border border-white/5 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            Receita por Plano
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(data.plans).map(([plan, info]) => {
              const planColors = {
                starter: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
                professional: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
                enterprise: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/30' }
              };
              const colors = planColors[plan] || planColors.starter;
              
              return (
                <div key={plan} className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
                  <div className={`text-sm font-medium ${colors.text} uppercase tracking-wider mb-2`}>
                    {plan}
                  </div>
                  <div className="text-2xl font-playfair text-white">{info.count}</div>
                  <div className="text-xs text-slate-400">hotéis</div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className={`text-lg font-semibold ${colors.text}`}>
                      R$ {info.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400">MRR do plano</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LTV & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-velvet/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            LTV - Lifetime Value
          </h3>
          <div className="text-4xl font-playfair text-purple-400 mb-2">{data.ltv.formatted}</div>
          <p className="text-sm text-slate-400">
            Valor estimado por cliente ao longo de 24 meses (média de permanência)
          </p>
          <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
            <div className="text-xs text-purple-300">
              LTV = ARPU ({data.arpu.formatted}) × 24 meses
            </div>
          </div>
        </div>

        <div className="bg-velvet/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Crescimento
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-playfair text-emerald-400">{data.growth.new_hotels_this_month}</div>
              <div className="text-sm text-slate-400">Novos hotéis este mês</div>
            </div>
            <div>
              <div className="text-3xl font-playfair text-white">{data.growth.total_hotels}</div>
              <div className="text-sm text-slate-400">Total de hotéis</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
            <div className="text-xs text-emerald-300">
              Taxa de conversão Trial → Ativo: {data.contracts.active > 0 && data.contracts.trial > 0 
                ? ((data.contracts.active / (data.contracts.active + data.contracts.trial)) * 100).toFixed(1) 
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="bg-velvet/50 border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Indicadores de Saúde do Negócio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${data.churn.rate <= 5 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className="text-sm text-slate-400 mb-1">Churn</div>
            <div className={`text-xl font-semibold ${data.churn.rate <= 5 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.churn.rate <= 5 ? 'Saudável' : 'Atenção'}
            </div>
            <div className="text-xs text-slate-500">Meta: &lt; 5%</div>
          </div>
          
          <div className={`p-4 rounded-lg ${data.arpu.value >= 400 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <div className="text-sm text-slate-400 mb-1">ARPU</div>
            <div className={`text-xl font-semibold ${data.arpu.value >= 400 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.arpu.value >= 400 ? 'Bom' : 'Melhorar'}
            </div>
            <div className="text-xs text-slate-500">Meta: R$ 400+</div>
          </div>
          
          <div className={`p-4 rounded-lg ${data.contracts.trial > 0 ? 'bg-amber-500/10' : 'bg-slate-500/10'}`}>
            <div className="text-sm text-slate-400 mb-1">Trials Ativos</div>
            <div className={`text-xl font-semibold ${data.contracts.trial > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {data.contracts.trial} hotéis
            </div>
            <div className="text-xs text-slate-500">Converter para pagos</div>
          </div>
          
          <div className="p-4 rounded-lg bg-gold/10">
            <div className="text-sm text-slate-400 mb-1">Comissão/GMV</div>
            <div className="text-xl font-semibold text-gold">10%</div>
            <div className="text-xs text-slate-500">Taxa padrão</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueB2BPage;
