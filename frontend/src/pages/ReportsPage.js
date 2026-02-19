import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BedDouble,
  Calendar,
  Loader2,
  Download,
  Filter,
  PieChart,
  Activity,
  Globe,
  Target
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ReportsPage = () => {
  const { token, currentHotel } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [guests, setGuests] = useState(null);
  const [channels, setChannels] = useState(null);
  const [exporting, setExporting] = useState(false);

  const hotelId = currentHotel?.id;

  useEffect(() => {
    if (hotelId) {
      loadReports();
    }
  }, [hotelId, period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [overviewRes, revenueRes, occupancyRes, guestsRes, channelsRes] = await Promise.all([
        fetch(`${API_URL}/api/reports/overview/${hotelId}?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/reports/revenue/${hotelId}?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/reports/occupancy/${hotelId}?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/reports/guests/${hotelId}?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/reports/channels/${hotelId}?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (revenueRes.ok) setRevenue(await revenueRes.json());
      if (occupancyRes.ok) setOccupancy(await occupancyRes.json());
      if (guestsRes.ok) setGuests(await guestsRes.json());
      if (channelsRes.ok) setChannels(await channelsRes.json());
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType, format) => {
    setExporting(true);
    try {
      const response = await fetch(
        `${API_URL}/api/reports/export/${hotelId}?report_type=${reportType}&format=${format}&period=${period}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}_${period}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          toast.success('Relatório exportado com sucesso');
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}_${period}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          toast.success('Relatório exportado com sucesso');
        }
      } else {
        toast.error('Erro ao exportar relatório');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const TrendIndicator = ({ value, suffix = '%' }) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {isPositive ? '+' : ''}{value}{suffix}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#D4AF37]" />
            Relatórios Avançados
          </h1>
          <p className="text-[#94A3B8] mt-1">
            Análise detalhada de performance do hotel
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-[#0B1120] border-white/10 text-[#F8FAFC]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151E32] border-white/10">
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => {
            const [type, format] = value.split('-');
            exportReport(type, format);
          }}>
            <SelectTrigger className="w-44 bg-[#0B1120] border-white/10 text-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {exporting ? 'Exportando...' : 'Exportar'}
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#151E32] border-white/10">
              <SelectItem value="overview-csv">Resumo (CSV)</SelectItem>
              <SelectItem value="overview-json">Resumo (JSON)</SelectItem>
              <SelectItem value="revenue-csv">Receita (CSV)</SelectItem>
              <SelectItem value="revenue-json">Receita (JSON)</SelectItem>
              <SelectItem value="occupancy-csv">Ocupação (CSV)</SelectItem>
              <SelectItem value="channels-csv">Canais (CSV)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <TrendIndicator value={overview.comparison?.revenue_change} />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-3">
                {formatCurrency(overview.kpis?.total_revenue)}
              </p>
              <p className="text-sm text-[#94A3B8]">Receita Total</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-blue-400" />
                </div>
                <TrendIndicator value={overview.comparison?.occupancy_change} />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-3">
                {overview.kpis?.occupancy_rate}%
              </p>
              <p className="text-sm text-[#94A3B8]">Ocupação</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <TrendIndicator value={overview.comparison?.adr_change} />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-3">
                {formatCurrency(overview.kpis?.adr)}
              </p>
              <p className="text-sm text-[#94A3B8]">ADR</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-3">
                {formatCurrency(overview.kpis?.revpar)}
              </p>
              <p className="text-sm text-[#94A3B8]">RevPAR</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-3">
                {overview.kpis?.total_reservations}
              </p>
              <p className="text-sm text-[#94A3B8]">Reservas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-3">
                {overview.kpis?.avg_stay_length} dias
              </p>
              <p className="text-sm text-[#94A3B8]">Estadia Média</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#151E32]/50 border border-white/5">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <BarChart3 className="w-4 h-4 mr-2" />
            Receita
          </TabsTrigger>
          <TabsTrigger value="occupancy" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <BedDouble className="w-4 h-4 mr-2" />
            Ocupação
          </TabsTrigger>
          <TabsTrigger value="guests" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Users className="w-4 h-4 mr-2" />
            Hóspedes
          </TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Globe className="w-4 h-4 mr-2" />
            Canais
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-[#151E32]/50 border-white/5 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Receita Diária</CardTitle>
                <CardDescription className="text-[#94A3B8]">
                  Evolução da receita no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenue?.daily_data?.slice(-14)}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94A3B8"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis 
                        stroke="#94A3B8"
                        tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F' }}
                        formatter={(value) => [formatCurrency(value), '']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#D4AF37" 
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Receita"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Composição</CardTitle>
                <CardDescription className="text-[#94A3B8]">
                  Por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Hospedagem', value: revenue?.totals?.rooms || 0 },
                          { name: 'A&B', value: revenue?.totals?.fnb || 0 },
                          { name: 'Spa', value: revenue?.totals?.spa || 0 },
                          { name: 'Eventos', value: revenue?.totals?.events || 0 },
                          { name: 'Outros', value: revenue?.totals?.other || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F' }}
                        formatter={(value) => [formatCurrency(value), '']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {[
                    { name: 'Hospedagem', percent: revenue?.breakdown_percent?.rooms, color: COLORS[0] },
                    { name: 'A&B', percent: revenue?.breakdown_percent?.fnb, color: COLORS[1] },
                    { name: 'Spa', percent: revenue?.breakdown_percent?.spa, color: COLORS[2] },
                    { name: 'Eventos', percent: revenue?.breakdown_percent?.events, color: COLORS[3] },
                    { name: 'Outros', percent: revenue?.breakdown_percent?.other, color: COLORS[4] }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#94A3B8]">{item.name}</span>
                      </div>
                      <span className="text-[#F8FAFC]">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Occupancy Chart */}
            <Card className="bg-[#151E32]/50 border-white/5 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Taxa de Ocupação</CardTitle>
                <CardDescription className="text-[#94A3B8]">
                  Evolução diária
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancy?.daily_data?.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94A3B8"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis stroke="#94A3B8" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F' }}
                        formatter={(value) => [`${value}%`, 'Ocupação']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                      />
                      <Bar dataKey="occupancy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Stats */}
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0B1120]/50 border border-white/5">
                  <p className="text-sm text-[#94A3B8]">Ocupação Média</p>
                  <p className="text-3xl font-bold text-[#F8FAFC]">{occupancy?.summary?.avg_occupancy}%</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400">Pico</p>
                    <p className="text-xl font-bold text-green-400">{occupancy?.summary?.peak_occupancy}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">Mínimo</p>
                    <p className="text-xl font-bold text-red-400">{occupancy?.summary?.low_occupancy}%</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Room Nights Vendidas</span>
                    <span className="text-[#F8FAFC]">{occupancy?.summary?.total_room_nights_sold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Cancelamentos</span>
                    <span className="text-red-400">{occupancy?.summary?.total_cancellations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">No-Shows</span>
                    <span className="text-orange-400">{occupancy?.summary?.total_no_shows}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Type Performance */}
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-[#F8FAFC]">Performance por Tipo de Quarto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {occupancy?.by_room_type?.map((room, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#0B1120]/50 border border-white/5">
                    <h4 className="font-semibold text-[#F8FAFC] mb-3">{room.type}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#94A3B8]">Ocupação</span>
                        <span className="text-[#F8FAFC]">{room.occupancy}%</span>
                      </div>
                      <div className="w-full bg-[#1E3A5F] rounded-full h-2">
                        <div 
                          className="bg-[#D4AF37] h-2 rounded-full" 
                          style={{ width: `${room.occupancy}%` }}
                        />
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-sm text-[#94A3B8]">ADR</span>
                        <span className="text-[#D4AF37]">{formatCurrency(room.adr)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-4">
                <Users className="w-8 h-8 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-[#F8FAFC]">{guests?.total_guests}</p>
                <p className="text-sm text-[#94A3B8]">Total de Hóspedes</p>
              </CardContent>
            </Card>
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-4">
                <Users className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-[#F8FAFC]">{guests?.new_guests}</p>
                <p className="text-sm text-[#94A3B8]">Novos Hóspedes</p>
              </CardContent>
            </Card>
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-4">
                <Users className="w-8 h-8 text-[#D4AF37] mb-2" />
                <p className="text-2xl font-bold text-[#F8FAFC]">{guests?.returning_guests}</p>
                <p className="text-sm text-[#94A3B8]">Retornantes</p>
              </CardContent>
            </Card>
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardContent className="p-4">
                <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-[#F8FAFC]">{guests?.returning_rate}%</p>
                <p className="text-sm text-[#94A3B8]">Taxa de Retorno</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By Country */}
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Por País</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {guests?.demographics?.by_country?.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#94A3B8]">{item.country}</span>
                        <span className="text-[#F8FAFC]">{item.percent}%</span>
                      </div>
                      <div className="w-full bg-[#1E3A5F] rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ width: `${item.percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Purpose */}
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Propósito da Viagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={guests?.demographics?.by_purpose}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="percent"
                        nameKey="purpose"
                      >
                        {guests?.demographics?.by_purpose?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F' }}
                        formatter={(value) => [`${value}%`, '']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {guests?.demographics?.by_purpose?.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[#94A3B8]">{item.purpose}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Booking Source */}
            <Card className="bg-[#151E32]/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Fonte de Reserva</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {guests?.demographics?.by_booking_source?.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#94A3B8]">{item.source}</span>
                        <span className="text-[#F8FAFC]">{item.percent}%</span>
                      </div>
                      <div className="w-full bg-[#1E3A5F] rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ width: `${item.percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="mt-6 space-y-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-[#F8FAFC]">Canais de Distribuição</CardTitle>
              <CardDescription className="text-[#94A3B8]">
                Performance por canal de vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-[#94A3B8] font-medium">Canal</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-medium">Reservas</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-medium">Receita</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-medium">ADR</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-medium">Comissão</th>
                      <th className="text-right py-3 px-4 text-[#94A3B8] font-medium">% Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels?.channels?.map((channel, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-[#F8FAFC] font-medium">{channel.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-[#F8FAFC]">{channel.reservations}</td>
                        <td className="text-right py-3 px-4 text-[#D4AF37] font-medium">
                          {formatCurrency(channel.revenue)}
                        </td>
                        <td className="text-right py-3 px-4 text-[#F8FAFC]">{formatCurrency(channel.adr)}</td>
                        <td className="text-right py-3 px-4 text-red-400">
                          {channel.commission > 0 ? `${channel.commission}%` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 text-[#F8FAFC]">{channel.percent_revenue}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0B1120]/50">
                      <td className="py-3 px-4 font-semibold text-[#F8FAFC]">Total</td>
                      <td className="text-right py-3 px-4 font-semibold text-[#F8FAFC]">
                        {channels?.totals?.reservations}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-[#D4AF37]">
                        {formatCurrency(channels?.totals?.revenue)}
                      </td>
                      <td className="text-right py-3 px-4 text-[#94A3B8]">-</td>
                      <td className="text-right py-3 px-4 font-semibold text-red-400">
                        {formatCurrency(channels?.totals?.commission_paid)}
                      </td>
                      <td className="text-right py-3 px-4 text-[#94A3B8]">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-[#F8FAFC]">Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {channels?.insights?.map((insight, i) => (
                  <div key={i} className="p-4 rounded-lg bg-[#0B1120]/50 border border-[#D4AF37]/20">
                    <p className="text-[#F8FAFC]">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
