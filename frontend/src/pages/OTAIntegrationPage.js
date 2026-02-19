import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { 
  Globe, Settings, RefreshCw, Check, X, AlertTriangle, 
  ExternalLink, Save, Eye, EyeOff, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OTAIntegrationPage = () => {
  const { token, currentHotel } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

  const channelLogos = {
    booking: { name: 'Booking.com', color: 'bg-blue-600', icon: '🅱️' },
    expedia: { name: 'Expedia', color: 'bg-yellow-500', icon: '🌐' },
    airbnb: { name: 'Airbnb', color: 'bg-rose-500', icon: '🏠' },
    decolar: { name: 'Decolar', color: 'bg-purple-600', icon: '✈️' }
  };

  useEffect(() => {
    if (currentHotel?.id) {
      fetchChannels();
    }
  }, [currentHotel]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${currentHotel.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const initChannels = async () => {
    try {
      await fetch(`${API_URL}/api/ota/channels/${currentHotel.id}/init`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Canais inicializados');
      fetchChannels();
    } catch (error) {
      toast.error('Erro ao inicializar canais');
    }
  };

  const toggleChannel = async (channelId) => {
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${channelId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      toast.success(data.message);
      fetchChannels();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const saveChannel = async (channel) => {
    try {
      await fetch(`${API_URL}/api/ota/channels/${currentHotel.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingChannel)
      });
      toast.success('Configurações salvas');
      setEditingChannel(null);
      fetchChannels();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const syncChannel = async (channelId) => {
    try {
      const response = await fetch(`${API_URL}/api/ota/channels/${channelId}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      toast.success(data.message);
      fetchChannels();
    } catch (error) {
      toast.error('Erro na sincronização');
    }
  };

  return (
    <div className="space-y-6" data-testid="ota-integration-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-[#D4AF37]" />
            Integração OTAs
          </h1>
          <p className="text-gray-400">Conecte seu hotel às principais agências de viagem online</p>
        </div>
        <Button onClick={fetchChannels} variant="outline" className="border-gray-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-400 font-semibold">Configuração Necessária</p>
            <p className="text-gray-400 text-sm">
              Para ativar cada canal, você precisará das credenciais de API do respectivo parceiro. 
              Entre em contato com o suporte de cada OTA para obter suas credenciais.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Channels Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      ) : channels.length === 0 ? (
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-12 text-center">
            <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum canal configurado</h3>
            <p className="text-gray-400 mb-6">Inicialize os canais de distribuição padrão</p>
            <Button onClick={initChannels} className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929]">
              Inicializar Canais OTA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {channels.map((channel) => {
            const logo = channelLogos[channel.channel_name] || { name: channel.display_name, color: 'bg-gray-600', icon: '🌐' };
            const isEditing = editingChannel?.id === channel.id;
            
            return (
              <Card key={channel.id} className={`bg-[#0f2744]/50 border-gray-700/50 ${channel.is_active ? 'border-emerald-500/30' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${logo.color} flex items-center justify-center text-2xl`}>
                        {logo.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white">{channel.display_name || logo.name}</CardTitle>
                        <p className="text-xs text-gray-500">Comissão: {channel.commission_rate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={channel.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                        {channel.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch
                        checked={channel.is_active}
                        onCheckedChange={() => toggleChannel(channel.id)}
                        disabled={!channel.api_key && !channel.api_username}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {isEditing ? (
                    /* Editing Form */
                    <div className="space-y-3 p-4 bg-[#0a1929]/50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-400 text-xs">Property ID</Label>
                          <Input
                            value={editingChannel.property_id || ''}
                            onChange={(e) => setEditingChannel({...editingChannel, property_id: e.target.value})}
                            className="bg-[#0a1929] border-gray-700 text-white text-sm"
                            placeholder="ID do hotel na OTA"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Comissão %</Label>
                          <Input
                            type="number"
                            value={editingChannel.commission_rate || ''}
                            onChange={(e) => setEditingChannel({...editingChannel, commission_rate: parseFloat(e.target.value)})}
                            className="bg-[#0a1929] border-gray-700 text-white text-sm"
                          />
                        </div>
                      </div>
                      
                      {channel.channel_name === 'booking' && (
                        <>
                          <div>
                            <Label className="text-gray-400 text-xs">Username</Label>
                            <Input
                              value={editingChannel.api_username || ''}
                              onChange={(e) => setEditingChannel({...editingChannel, api_username: e.target.value})}
                              className="bg-[#0a1929] border-gray-700 text-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Password</Label>
                            <div className="relative">
                              <Input
                                type={showPasswords[channel.id] ? 'text' : 'password'}
                                value={editingChannel.api_password || ''}
                                onChange={(e) => setEditingChannel({...editingChannel, api_password: e.target.value})}
                                className="bg-[#0a1929] border-gray-700 text-white text-sm pr-10"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2"
                                onClick={() => setShowPasswords({...showPasswords, [channel.id]: !showPasswords[channel.id]})}
                              >
                                {showPasswords[channel.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {(channel.channel_name === 'expedia' || channel.channel_name === 'airbnb') && (
                        <>
                          <div>
                            <Label className="text-gray-400 text-xs">API Key</Label>
                            <Input
                              value={editingChannel.api_key || ''}
                              onChange={(e) => setEditingChannel({...editingChannel, api_key: e.target.value})}
                              className="bg-[#0a1929] border-gray-700 text-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">API Secret</Label>
                            <Input
                              type="password"
                              value={editingChannel.api_secret || ''}
                              onChange={(e) => setEditingChannel({...editingChannel, api_secret: e.target.value})}
                              className="bg-[#0a1929] border-gray-700 text-white text-sm"
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => saveChannel(channel)} size="sm" className="bg-[#D4AF37] text-[#0a1929]">
                          <Save className="w-4 h-4 mr-1" /> Salvar
                        </Button>
                        <Button onClick={() => setEditingChannel(null)} size="sm" variant="outline" className="border-gray-700">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="flex items-center justify-between p-3 bg-[#0a1929]/50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Property ID</p>
                          <p className="text-white text-sm">{channel.property_id || 'Não configurado'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Última Sincronização</p>
                          <p className="text-white text-sm">
                            {channel.last_sync_at ? new Date(channel.last_sync_at).toLocaleString('pt-BR') : 'Nunca'}
                          </p>
                        </div>
                      </div>
                      
                      {channel.last_sync_status && (
                        <div className={`flex items-center gap-2 text-sm ${channel.last_sync_status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {channel.last_sync_status === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          Status: {channel.last_sync_status}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setEditingChannel({...channel})} 
                          variant="outline" 
                          size="sm"
                          className="flex-1 border-gray-700"
                        >
                          <Settings className="w-4 h-4 mr-1" /> Configurar
                        </Button>
                        <Button 
                          onClick={() => syncChannel(channel.id)}
                          disabled={!channel.is_active}
                          size="sm"
                          className="flex-1 bg-[#D4AF37] text-[#0a1929]"
                        >
                          <Zap className="w-4 h-4 mr-1" /> Sincronizar
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-[#0f2744]/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white text-lg">Como Configurar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <span className="text-lg">🅱️</span> Booking.com
              </h4>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Acesse o Connectivity Partner Portal</li>
                <li>Solicite credenciais de API</li>
                <li>Configure o Property ID do seu hotel</li>
                <li>Insira username e password aqui</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <span className="text-lg">🌐</span> Expedia
              </h4>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Acesse o Expedia Partner Central</li>
                <li>Vá em Connectivity &gt; API Credentials</li>
                <li>Gere uma API Key e Secret</li>
                <li>Configure aqui com o Hotel ID</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTAIntegrationPage;
