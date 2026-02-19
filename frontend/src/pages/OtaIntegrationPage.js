import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Globe, 
  RefreshCw, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Building2,
  Link2,
  Percent,
  Calendar,
  Zap,
  History,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OTA_INFO = {
  booking: {
    name: 'Booking.com',
    logo: 'https://cf.bstatic.com/static/img/favicon/9ccd97444ec0f01c9e7f8a26ff23caefc0fe0498.ico',
    color: '#003580',
    description: 'A maior plataforma de reservas do mundo',
    docs: 'https://developers.booking.com/',
    fields: ['api_username', 'api_password', 'property_id']
  },
  expedia: {
    name: 'Expedia',
    logo: 'https://www.expedia.com/favicon.ico',
    color: '#00355F',
    description: 'Grupo Expedia - Hoteis.com, Vrbo',
    docs: 'https://developers.expediagroup.com/',
    fields: ['api_key', 'api_secret', 'property_id']
  },
  airbnb: {
    name: 'Airbnb',
    logo: 'https://a0.muscache.com/airbnb/static/icons/apple-touch-icon-180x180-bcbe0e3960cd084eb8eaf1353cf3c730.png',
    color: '#FF5A5F',
    description: 'Marketplace de hospedagem alternativa',
    docs: 'https://www.airbnb.com/partner/api',
    fields: ['api_key', 'property_id']
  },
  decolar: {
    name: 'Decolar',
    logo: 'https://www.decolar.com/favicon.ico',
    color: '#7B2D8E',
    description: 'Líder na América Latina',
    docs: 'https://developers.despegar.com/',
    fields: ['api_key', 'property_id']
  }
};

const OtaIntegrationPage = () => {
  const { token, currentHotel } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [testing, setTesting] = useState({});
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('channels');
  const [configForm, setConfigForm] = useState({
    api_username: '',
    api_password: '',
    api_key: '',
    api_secret: '',
    property_id: '',
    commission_rate: 15
  });

  const hotelId = currentHotel?.id;

  useEffect(() => {
    if (hotelId) {
      loadChannels();
    }
  }, [hotelId]);

  const loadChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${hotelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Erro ao carregar canais:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${hotelId}/init`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Canais OTA inicializados');
        loadChannels();
      }
    } catch (error) {
      toast.error('Erro ao inicializar canais');
    }
  };

  const toggleChannel = async (channelId, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${channelId}/toggle`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (response.ok) {
        toast.success(currentStatus ? 'Canal desativado' : 'Canal ativado');
        loadChannels();
      }
    } catch (error) {
      toast.error('Erro ao atualizar canal');
    }
  };

  const syncChannel = async (channelId) => {
    setSyncing(prev => ({ ...prev, [channelId]: true }));
    
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${channelId}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Sincronização iniciada');
        setTimeout(loadChannels, 2000);
      } else {
        toast.error(data.detail || 'Erro na sincronização');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar');
    } finally {
      setSyncing(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const saveChannelConfig = async () => {
    if (!selectedChannel) return;
    
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${hotelId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel_name: selectedChannel.channel_name,
          ...configForm
        })
      });
      
      if (response.ok) {
        toast.success('Configurações salvas');
        setConfigOpen(false);
        loadChannels();
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const openConfig = (channel) => {
    setSelectedChannel(channel);
    setConfigForm({
      api_username: channel.api_username || '',
      api_password: '',
      api_key: channel.api_key || '',
      property_id: channel.property_id || '',
      commission_rate: channel.commission_rate || 15
    });
    setConfigOpen(true);
  };

  const getStatusBadge = (channel) => {
    if (!channel.is_active) {
      return <Badge variant="outline" className="text-gray-400 border-gray-600">Inativo</Badge>;
    }
    
    if (channel.last_sync_status === 'success') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>;
    }
    
    if (channel.last_sync_status === 'error') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Erro</Badge>;
    }
    
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ota-integration-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-3">
            <Globe className="w-7 h-7 text-[#D4AF37]" />
            Integrações OTA
          </h1>
          <p className="text-[#94A3B8] mt-1">
            Gerencie conexões com canais de distribuição online
          </p>
        </div>
        
        {channels.length === 0 && (
          <Button 
            onClick={initializeChannels}
            className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
            data-testid="init-channels-btn"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Inicializar Canais
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[#94A3B8]">Canais Ativos</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {channels.filter(c => c.is_active).length}
                </p>
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
                <p className="text-sm text-[#94A3B8]">Conectados</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {channels.filter(c => c.is_active && c.last_sync_status === 'success').length}
                </p>
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
                <p className="text-sm text-[#94A3B8]">Última Sync</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {channels.some(c => c.last_sync_at) ? 'Hoje' : '-'}
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
                <p className="text-sm text-[#94A3B8]">Comissão Média</p>
                <p className="text-xl font-bold text-[#F8FAFC]">
                  {channels.length > 0 
                    ? (channels.reduce((sum, c) => sum + (c.commission_rate || 15), 0) / channels.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Cards */}
      {channels.length === 0 ? (
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-12 text-center">
            <Globe className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
            <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
              Nenhum canal configurado
            </h3>
            <p className="text-[#94A3B8] mb-6">
              Clique em "Inicializar Canais" para começar a integração com OTAs
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {channels.map((channel) => {
            const info = OTA_INFO[channel.channel_name] || {
              name: channel.display_name || channel.channel_name,
              color: '#6B7280',
              description: 'Canal de distribuição'
            };
            
            return (
              <Card 
                key={channel.id} 
                className={`bg-[#151E32]/50 border-white/5 transition-all hover:border-white/10 ${
                  channel.is_active ? '' : 'opacity-60'
                }`}
                data-testid={`ota-channel-${channel.channel_name}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${info.color}20` }}
                      >
                        <Building2 className="w-6 h-6" style={{ color: info.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-[#F8FAFC]">{info.name}</CardTitle>
                        <CardDescription className="text-[#94A3B8]">{info.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(channel)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Channel Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#94A3B8]">ID Propriedade</p>
                      <p className="text-[#F8FAFC] font-medium">
                        {channel.property_id || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8]">Comissão</p>
                      <p className="text-[#F8FAFC] font-medium">
                        {channel.commission_rate || 15}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8]">Última Sync</p>
                      <p className="text-[#F8FAFC] font-medium">
                        {channel.last_sync_at 
                          ? new Date(channel.last_sync_at).toLocaleString('pt-BR')
                          : 'Nunca'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8]">Sync Automático</p>
                      <p className="text-[#F8FAFC] font-medium">
                        {channel.sync_enabled ? 'Ativado' : 'Desativado'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {channel.error_message && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{channel.error_message}</p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#94A3B8]">Ativo</span>
                      <Switch 
                        checked={channel.is_active}
                        onCheckedChange={() => toggleChannel(channel.id, channel.is_active)}
                        data-testid={`toggle-${channel.channel_name}`}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]"
                        onClick={() => openConfig(channel)}
                        data-testid={`config-${channel.channel_name}`}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configurar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/10 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        onClick={() => syncChannel(channel.id)}
                        disabled={!channel.is_active || syncing[channel.id]}
                        data-testid={`sync-${channel.channel_name}`}
                      >
                        {syncing[channel.id] ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        Sincronizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#D4AF37]" />
              Configurar {selectedChannel?.display_name || selectedChannel?.channel_name}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Configure as credenciais de API para conectar com a OTA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Usuário API</Label>
                <Input 
                  value={configForm.api_username}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, api_username: e.target.value }))}
                  placeholder="username"
                  className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Senha API</Label>
                <Input 
                  type="password"
                  value={configForm.api_password}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, api_password: e.target.value }))}
                  placeholder="••••••••"
                  className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">API Key (se aplicável)</Label>
              <Input 
                value={configForm.api_key}
                onChange={(e) => setConfigForm(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="sua-api-key"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">ID da Propriedade</Label>
                <Input 
                  value={configForm.property_id}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, property_id: e.target.value }))}
                  placeholder="12345678"
                  className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Taxa de Comissão (%)</Label>
                <Input 
                  type="number"
                  value={configForm.commission_rate}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                  min="0"
                  max="50"
                  className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setConfigOpen(false)}
                className="border-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveChannelConfig}
                className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                data-testid="save-config-btn"
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OtaIntegrationPage;
