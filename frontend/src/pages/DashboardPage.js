import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import useWebSocket from '../hooks/useWebSocket';
import { 
  BedDouble, 
  Users, 
  CalendarCheck, 
  CalendarX, 
  TrendingUp, 
  DollarSign,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Bell,
  BellRing
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'gold' }) => {
  const colorMap = {
    gold: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20',
    green: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  return (
    <Card className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 transition-all duration-500 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg ${colorMap[color]} border`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="font-display text-3xl font-bold text-[#F8FAFC] group-hover:text-[#D4AF37] transition-colors">
            {value}
          </h3>
          <p className="text-sm text-[#94A3B8] mt-1">{title}</p>
          {subtitle && <p className="text-xs text-[#475569] mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B1120] border border-[#D4AF37]/30 rounded-sm p-3 shadow-lg">
        <p className="text-[#94A3B8] text-xs mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[#F8FAFC] text-sm font-semibold">
            {entry.name}: {entry.name === 'Receita' ? `R$ ${entry.value?.toLocaleString('pt-BR')}` : `${entry.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const { currentHotel, seedDemoData } = useAuth();
  const [stats, setStats] = useState(null);
  const [occupancyData, setOccupancyData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!currentHotel) return;
    
    try {
      setLoading(true);
      const [statsRes, occupancyRes, revenueRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats?hotel_id=${currentHotel.id}`),
        axios.get(`${API}/dashboard/occupancy-chart?hotel_id=${currentHotel.id}&days=7`),
        axios.get(`${API}/dashboard/revenue-chart?hotel_id=${currentHotel.id}&days=7`)
      ]);
      
      setStats(statsRes.data);
      setOccupancyData(occupancyRes.data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
      })));
      setRevenueData(revenueRes.data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
      })));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentHotel]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedDemoData();
      await fetchDashboardData();
    } catch (error) {
      console.error('Seed error:', error);
    }
    setSeeding(false);
  };

  if (!currentHotel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Database className="w-16 h-16 text-[#D4AF37]/50 mb-4" />
        <h2 className="font-display text-2xl text-[#F8FAFC] mb-2">Nenhum Hotel Configurado</h2>
        <p className="text-[#94A3B8] mb-6 max-w-md">
          Para começar a usar o sistema, clique no botão abaixo para criar dados de demonstração.
        </p>
        <Button
          onClick={handleSeedData}
          disabled={seeding}
          className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold px-8 py-6 uppercase tracking-widest text-xs"
          data-testid="seed-data-btn"
        >
          {seeding ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Criar Dados de Demonstração
            </>
          )}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg bg-[#0B1120]" />
                <Skeleton className="h-8 w-20 mt-4 bg-[#0B1120]" />
                <Skeleton className="h-4 w-32 mt-2 bg-[#0B1120]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Dashboard</h1>
          <p className="text-[#94A3B8] mt-1">{currentHotel.name} • Visão geral em tempo real</p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          className="border-white/10 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-[#94A3B8] hover:text-[#D4AF37]"
          data-testid="refresh-dashboard-btn"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Taxa de Ocupação"
          value={`${stats?.occupancy_rate || 0}%`}
          subtitle={`${stats?.occupied_rooms || 0} de ${stats?.total_rooms || 0} quartos`}
          icon={Percent}
          trend="+5.2%"
          trendUp={true}
          color="gold"
        />
        <StatCard
          title="Hóspedes na Casa"
          value={stats?.guests_in_house || 0}
          subtitle="Atualmente hospedados"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Check-ins Hoje"
          value={stats?.todays_checkins || 0}
          subtitle={`${stats?.pending_reservations || 0} pendentes`}
          icon={CalendarCheck}
          color="green"
        />
        <StatCard
          title="Check-outs Hoje"
          value={stats?.todays_checkouts || 0}
          subtitle="Previstos para hoje"
          icon={CalendarX}
          color="orange"
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Receita Hoje"
          value={`R$ ${(stats?.revenue_today || 0).toLocaleString('pt-BR')}`}
          subtitle="Pagamentos recebidos"
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
          color="green"
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${(stats?.revenue_month || 0).toLocaleString('pt-BR')}`}
          subtitle="Acumulado mensal"
          icon={TrendingUp}
          trend="+8.3%"
          trendUp={true}
          color="gold"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardHeader>
            <CardTitle className="font-display text-lg text-[#F8FAFC] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#D4AF37]" />
              Taxa de Ocupação (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData}>
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="occupancy" 
                    name="Ocupação"
                    stroke="#D4AF37" 
                    strokeWidth={2}
                    fill="url(#occupancyGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardHeader>
            <CardTitle className="font-display text-lg text-[#F8FAFC] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
              Receita Diária (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    name="Receita"
                    fill="#D4AF37" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151E32]/30 border border-white/5 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[#F8FAFC] font-semibold">{stats?.available_rooms || 0}</p>
            <p className="text-xs text-[#94A3B8]">Disponíveis</p>
          </div>
        </div>
        <div className="bg-[#151E32]/30 border border-white/5 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[#F8FAFC] font-semibold">{stats?.occupied_rooms || 0}</p>
            <p className="text-xs text-[#94A3B8]">Ocupados</p>
          </div>
        </div>
        <div className="bg-[#151E32]/30 border border-white/5 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-400/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-[#F8FAFC] font-semibold">{stats?.pending_reservations || 0}</p>
            <p className="text-xs text-[#94A3B8]">Pendentes</p>
          </div>
        </div>
        <div className="bg-[#151E32]/30 border border-white/5 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[#F8FAFC] font-semibold">{stats?.total_rooms || 0}</p>
            <p className="text-xs text-[#94A3B8]">Total Quartos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
