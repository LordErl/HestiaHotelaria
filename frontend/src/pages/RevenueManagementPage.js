import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, 
  BedDouble, Users, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  RefreshCw, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const RevenueManagementPage = () => {
  const { token, currentHotel } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (currentHotel?.id) {
      fetchAllData();
    }
  }, [currentHotel, period]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [analyticsRes, forecastRes, suggestionsRes] = await Promise.all([
        fetch(`${API_URL}/api/revenue/analytics?hotel_id=${currentHotel.id}&period=${period}`, { headers }),
        fetch(`${API_URL}/api/revenue/forecast?hotel_id=${currentHotel.id}&days=30`, { headers }),
        fetch(`${API_URL}/api/revenue/pricing-suggestions?hotel_id=${currentHotel.id}`, { headers })
      ]);

      setAnalytics(await analyticsRes.json());
      setForecast(await forecastRes.json());
      setSuggestions(await suggestionsRes.json());
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

  const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  const getDemandBadge = (level) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Alta Demanda</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">Média</Badge>;
      case 'low':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Baixa</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="revenue-management-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
            Revenue Management
          </h1>
          <p className="text-gray-400">Análise de receita e precificação dinâmica</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px] bg-[#0a1929] border-gray-700" data-testid="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151E32] border-gray-700">
              <SelectItem value="7d" className="text-white">7 dias</SelectItem>
              <SelectItem value="30d" className="text-white">30 dias</SelectItem>
              <SelectItem value="90d" className="text-white">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAllData} variant="outline" className="border-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#D4AF37]/20">
                  <DollarSign className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.total_revenue)}</p>
              <p className="text-xs text-emerald-400 mt-2">
                {formatCurrency(analytics.paid_revenue)} recebido
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">ADR (Diária Média)</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.adr)}</p>
              <p className="text-xs text-gray-500 mt-2">Average Daily Rate</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">RevPAR</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revpar)}</p>
              <p className="text-xs text-gray-500 mt-2">Revenue per Available Room</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <BedDouble className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Taxa de Ocupação</p>
              <p className="text-2xl font-bold text-white">{formatPercent(analytics.occupancy_rate)}</p>
              <p className="text-xs text-gray-500 mt-2">{analytics.total_room_nights_sold} de {analytics.available_room_nights} diárias</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        {analytics?.daily_revenue && (
          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                Receita Diária
              </CardTitle>
              <CardDescription>Evolução da receita no período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.daily_revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F', borderRadius: '8px' }}
                    labelStyle={{ color: '#F8FAFC' }}
                    formatter={(value) => [formatCurrency(value), 'Receita']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Revenue by Room Type */}
        {analytics?.revenue_by_room_type && (
          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Receita por Tipo de Quarto
              </CardTitle>
              <CardDescription>Distribuição de receita por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.revenue_by_room_type).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {Object.keys(analytics.revenue_by_room_type).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F', borderRadius: '8px' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Forecast Section */}
      {forecast && (
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Previsão de Receita (Próximos 30 dias)
            </CardTitle>
            <CardDescription>Baseado em reservas confirmadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 rounded-lg bg-[#0a1929]/50">
                <p className="text-sm text-gray-400">Receita Prevista</p>
                <p className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(forecast.total_forecast_revenue)}</p>
              </div>
              <div className="p-4 rounded-lg bg-[#0a1929]/50">
                <p className="text-sm text-gray-400">Ocupação Média Prevista</p>
                <p className="text-2xl font-bold text-white">{formatPercent(forecast.avg_forecast_occupancy)}</p>
              </div>
              <div className="p-4 rounded-lg bg-[#0a1929]/50">
                <p className="text-sm text-gray-400">Lead Time Médio</p>
                <p className="text-2xl font-bold text-white">{analytics?.avg_lead_time_days || 0} dias</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={forecast.daily_forecast.slice(0, 14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151E32', border: '1px solid #1E3A5F', borderRadius: '8px' }}
                  labelStyle={{ color: '#F8FAFC' }}
                  formatter={(value, name) => [
                    name === 'confirmed_revenue' ? formatCurrency(value) : `${value}%`,
                    name === 'confirmed_revenue' ? 'Receita' : 'Ocupação'
                  ]}
                />
                <Bar dataKey="confirmed_revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pricing Suggestions */}
      {suggestions.length > 0 && (
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Sugestões de Precificação Dinâmica
            </CardTitle>
            <CardDescription>Recomendações baseadas em demanda e ocupação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={suggestion.room_type_id}
                  className="p-4 rounded-lg bg-[#0a1929]/50 border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">{suggestion.room_type_name}</h4>
                        {getDemandBadge(suggestion.demand_level)}
                      </div>
                      <p className="text-sm text-gray-400">
                        {suggestion.reservations_next_14d} reservas nos próximos 14 dias
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Preço Atual</p>
                        <p className="text-lg font-semibold text-white">{formatCurrency(suggestion.current_price)}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Ajuste Sugerido</p>
                        <p className={`text-lg font-semibold ${suggestion.suggested_adjustment_percent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {suggestion.suggested_adjustment_percent > 0 ? '+' : ''}{suggestion.suggested_adjustment_percent}%
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Preço Sugerido</p>
                        <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(suggestion.suggested_price)}</p>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        data-testid={`apply-pricing-${suggestion.room_type_id}`}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h4 className="font-semibold text-white">Reservas</h4>
              </div>
              <p className="text-3xl font-bold text-white mb-2">{analytics.total_reservations}</p>
              <p className="text-sm text-gray-400">Total no período</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-white">Receita Confirmada</h4>
              </div>
              <p className="text-3xl font-bold text-emerald-400 mb-2">{formatCurrency(analytics.paid_revenue)}</p>
              <p className="text-sm text-gray-400">{((analytics.paid_revenue / analytics.total_revenue) * 100 || 0).toFixed(1)}% do total</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f2744]/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h4 className="font-semibold text-white">Receita Pendente</h4>
              </div>
              <p className="text-3xl font-bold text-amber-400 mb-2">{formatCurrency(analytics.pending_revenue)}</p>
              <p className="text-sm text-gray-400">Aguardando pagamento</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RevenueManagementPage;
