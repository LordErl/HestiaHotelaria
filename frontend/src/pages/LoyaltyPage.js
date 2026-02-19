import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Crown, 
  Star, 
  Gift, 
  Users, 
  TrendingUp,
  Award,
  Sparkles,
  Loader2,
  Settings,
  Plus,
  Search,
  Percent,
  CreditCard,
  Trophy,
  Target
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TIER_COLORS = {
  Bronze: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  Silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', border: 'border-gray-400/30' },
  Gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Platinum: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' }
};

const LoyaltyPage = () => {
  const { token, currentHotel } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addPointsOpen, setAddPointsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  const hotelId = currentHotel?.id;

  useEffect(() => {
    if (hotelId) {
      loadData();
    }
  }, [hotelId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configRes, membersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/loyalty/config/${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/loyalty/members/${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/loyalty/stats/${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (configRes.ok) setConfig(await configRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateDemoData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/loyalty/demo-data/${hotelId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Dados de demonstração criados!');
        loadData();
      } else {
        toast.error('Erro ao criar dados de demonstração');
      }
    } catch (error) {
      toast.error('Erro ao criar dados de demonstração');
    }
  };

  const addPoints = async () => {
    if (!selectedMember || !pointsToAdd) return;
    
    try {
      const response = await fetch(`${API_URL}/api/loyalty/points/add`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guest_id: selectedMember.guest_id,
          hotel_id: hotelId,
          points: parseInt(pointsToAdd),
          reason: pointsReason || 'Crédito manual'
        })
      });

      if (response.ok) {
        toast.success('Pontos adicionados com sucesso!');
        setAddPointsOpen(false);
        setPointsToAdd('');
        setPointsReason('');
        setSelectedMember(null);
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao adicionar pontos');
    }
  };

  const filteredMembers = members.filter(m => 
    m.guests?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.guests?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="loyalty-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-3">
            <Crown className="w-7 h-7 text-[#D4AF37]" />
            Programa de Fidelidade
          </h1>
          <p className="text-[#94A3B8] mt-1">
            {config?.program_name || 'Hestia Rewards'} - Gerencie recompensas e membros
          </p>
        </div>
        
        <Button 
          variant="outline"
          className="border-white/10 text-[#F8FAFC]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Membros</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.total_members}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Ativos Mês</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.active_this_month}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Pontos Emitidos</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">
                    {stats.total_points_issued?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Resgatados Mês</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">
                    {stats.points_redeemed_month?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Média/Membro</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">
                    {stats.avg_points_per_member?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tiers Distribution */}
      {stats && (
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-[#F8FAFC]">Distribuição por Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(stats.by_tier || {}).map(([tier, count]) => {
                const colors = TIER_COLORS[tier] || TIER_COLORS.Bronze;
                return (
                  <div key={tier} className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className={`w-5 h-5 ${colors.text}`} />
                      <span className={`font-semibold ${colors.text}`}>{tier}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#F8FAFC]">{count}</p>
                    <p className="text-sm text-[#94A3B8]">membros</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#151E32]/50 border border-white/5">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Award className="w-4 h-4 mr-2" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Users className="w-4 h-4 mr-2" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="tiers" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Crown className="w-4 h-4 mr-2" />
            Tiers
          </TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config?.redemption_options?.map((option, index) => (
              <Card key={index} className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {option.points?.toLocaleString('pt-BR')} pts
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC] mb-1">{option.name}</h3>
                  <p className="text-sm text-[#94A3B8]">
                    {option.type === 'free_night' && 'Uma noite grátis no hotel'}
                    {option.type === 'room_upgrade' && 'Upgrade para categoria superior'}
                    {option.type === 'spa' && 'Tratamento no spa do hotel'}
                    {option.type === 'dining' && 'Experiência gastronômica'}
                    {option.type === 'transfer' && 'Traslado ida e volta'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#F8FAFC]">Membros do Programa</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    {filteredMembers.length} membros cadastrados
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <Input 
                    placeholder="Buscar membro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0B1120] border-white/10 text-[#F8FAFC] w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhum membro encontrado
                  </h3>
                  <p className="text-[#94A3B8]">
                    Os membros do programa aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map((member) => {
                    const tierColors = TIER_COLORS[member.current_tier] || TIER_COLORS.Bronze;
                    return (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/50 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full ${tierColors.bg} flex items-center justify-center`}>
                            <Crown className={`w-6 h-6 ${tierColors.text}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#F8FAFC]">
                              {member.guests?.name || 'Membro'}
                            </h4>
                            <p className="text-sm text-[#94A3B8]">
                              {member.guests?.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-[#94A3B8]">Pontos Disponíveis</p>
                            <p className="text-[#D4AF37] font-bold">
                              {member.available_points?.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-[#94A3B8]">Total Acumulado</p>
                            <p className="text-[#F8FAFC] font-medium">
                              {member.lifetime_points?.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <Badge className={`${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
                            {member.current_tier}
                          </Badge>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            onClick={() => {
                              setSelectedMember(member);
                              setAddPointsOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {config?.tiers?.map((tier, index) => {
              const colors = TIER_COLORS[tier.name] || TIER_COLORS.Bronze;
              return (
                <Card key={index} className={`bg-[#151E32]/50 border ${colors.border}`}>
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                      <Crown className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    <CardTitle className={colors.text}>{tier.name}</CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      A partir de {tier.min_points?.toLocaleString('pt-BR')} pontos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className={`w-4 h-4 ${colors.text}`} />
                      <span className={`font-semibold ${colors.text}`}>
                        {tier.multiplier}x pontos
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {tier.benefits?.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                          <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Points Dialog */}
      <Dialog open={addPointsOpen} onOpenChange={setAddPointsOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#D4AF37]" />
              Adicionar Pontos
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Adicione pontos manualmente para {selectedMember?.guests?.name || 'o membro'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Quantidade de Pontos</Label>
              <Input 
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                placeholder="500"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Motivo (opcional)</Label>
              <Input 
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="Bônus de boas-vindas"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setAddPointsOpen(false)}
                className="border-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={addPoints}
                className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                disabled={!pointsToAdd}
              >
                Adicionar Pontos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyPage;
