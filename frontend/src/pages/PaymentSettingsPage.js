import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Wallet, Building2, Check, X, Settings, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

const PaymentSettingsPage = () => {
  const { token } = useAuth();
  const [providers, setProviders] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingProvider, setEditingProvider] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const providerIcons = {
    stripe: <CreditCard className="w-6 h-6" />,
    mercado_pago: <Wallet className="w-6 h-6" />,
    cora: <Building2 className="w-6 h-6" />
  };

  const providerColors = {
    stripe: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    mercado_pago: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    cora: 'bg-green-500/20 border-green-500/50 text-green-300'
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      fetchProviders();
    }
  }, [selectedHotel]);

  const fetchHotels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hotels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setHotels(data);
      if (data.length > 0) {
        setSelectedHotel(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payment-providers/${selectedHotel}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payment-providers/${selectedHotel}/init`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      fetchProviders();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao inicializar provedores' });
    } finally {
      setLoading(false);
    }
  };

  const toggleProviderStatus = async (provider) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/payment-providers/${provider.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !provider.is_active })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `${provider.display_name} ${!provider.is_active ? 'ativado' : 'desativado'}` });
        fetchProviders();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar status' });
    } finally {
      setSaving(false);
    }
  };

  const saveProvider = async (provider) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/payment-providers/${provider.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingProvider)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso' });
        setEditingProvider(null);
        fetchProviders();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (providerId) => {
    if (!window.confirm('Tem certeza que deseja remover este provedor?')) return;
    
    try {
      await fetch(`${API_URL}/api/payment-providers/${providerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Provedor removido' });
      fetchProviders();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao remover provedor' });
    }
  };

  const renderProviderCard = (provider) => {
    const isEditing = editingProvider?.id === provider.id;
    const colorClass = providerColors[provider.provider_name] || 'bg-gray-500/20 border-gray-500/50';

    return (
      <div
        key={provider.id}
        className={`rounded-xl border ${colorClass} p-6 transition-all duration-300 hover:shadow-lg`}
        data-testid={`provider-card-${provider.provider_name}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${provider.is_active ? 'bg-amber-500/20' : 'bg-gray-600/20'}`}>
              {providerIcons[provider.provider_name] || <CreditCard className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{provider.display_name}</h3>
              <span className="text-sm text-gray-400 capitalize">{provider.provider_name.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleProviderStatus(provider)}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                provider.is_active
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-gray-600/20 text-gray-400 border border-gray-600/50'
              }`}
              data-testid={`toggle-${provider.provider_name}`}
            >
              {provider.is_active ? (
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Ativo</span>
              ) : (
                <span className="flex items-center gap-2"><X className="w-4 h-4" /> Inativo</span>
              )}
            </button>
            <button
              onClick={() => setEditingProvider(isEditing ? null : { ...provider })}
              className="p-2 rounded-lg bg-[#1e3a5f]/50 hover:bg-[#1e3a5f] transition-colors"
              data-testid={`edit-${provider.provider_name}`}
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Métodos Suportados */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(provider.supported_methods || []).map((method) => (
            <span
              key={method}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#0a1929]/50 text-amber-400 border border-amber-500/30"
            >
              {method === 'credit_card' ? '💳 Cartão' : method === 'pix' ? '📱 PIX' : method}
            </span>
          ))}
        </div>

        {/* Formulário de Edição */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome de Exibição</label>
              <input
                type="text"
                value={editingProvider.display_name || ''}
                onChange={(e) => setEditingProvider({ ...editingProvider, display_name: e.target.value })}
                className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            {/* Stripe Config */}
            {provider.provider_name === 'stripe' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={editingProvider.stripe_api_key || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, stripe_api_key: e.target.value })}
                    placeholder="sk_live_..."
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Webhook Secret</label>
                  <input
                    type="password"
                    value={editingProvider.stripe_webhook_secret || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, stripe_webhook_secret: e.target.value })}
                    placeholder="whsec_..."
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </>
            )}

            {/* Mercado Pago Config */}
            {provider.provider_name === 'mercado_pago' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Access Token</label>
                  <input
                    type="password"
                    value={editingProvider.mp_access_token || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, mp_access_token: e.target.value })}
                    placeholder="APP_USR-..."
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Public Key</label>
                  <input
                    type="text"
                    value={editingProvider.mp_public_key || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, mp_public_key: e.target.value })}
                    placeholder="APP_USR-..."
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </>
            )}

            {/* CORA Config */}
            {provider.provider_name === 'cora' && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={editingProvider.cora_client_id || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, cora_client_id: e.target.value })}
                    placeholder="int-..."
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Caminho do Certificado (.pem)</label>
                  <input
                    type="text"
                    value={editingProvider.cora_cert_path || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, cora_cert_path: e.target.value })}
                    placeholder="/path/to/certificate.pem"
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Caminho da Chave Privada (.key)</label>
                  <input
                    type="text"
                    value={editingProvider.cora_key_path || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, cora_key_path: e.target.value })}
                    placeholder="/path/to/private-key.key"
                    className="w-full bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cora_sandbox"
                    checked={editingProvider.cora_sandbox || false}
                    onChange={(e) => setEditingProvider({ ...editingProvider, cora_sandbox: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-[#0a1929]"
                  />
                  <label htmlFor="cora_sandbox" className="text-sm text-gray-400">Modo Sandbox (Testes)</label>
                </div>
              </>
            )}

            {/* Prioridade */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prioridade (ordem de exibição)</label>
              <input
                type="number"
                value={editingProvider.priority || 0}
                onChange={(e) => setEditingProvider({ ...editingProvider, priority: parseInt(e.target.value) })}
                className="w-24 bg-[#0a1929]/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => saveProvider(provider)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0a1929] rounded-lg font-medium transition-colors"
                data-testid={`save-${provider.provider_name}`}
              >
                <Save className="w-4 h-4" /> Salvar
              </button>
              <button
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteProvider(provider.id)}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Remover
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8" data-testid="payment-settings-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configurações de Pagamento</h1>
          <p className="text-gray-400">Gerencie os provedores de pagamento do seu hotel</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            className="bg-[#0a1929] border border-gray-700 rounded-lg px-4 py-2 text-white"
            data-testid="hotel-selector"
          >
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
          <button
            onClick={fetchProviders}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1e3a5f] hover:bg-[#2d4a6f] transition-colors"
            data-testid="refresh-providers"
          >
            <RefreshCw className={`w-5 h-5 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
          {message.text}
        </div>
      )}

      {/* Providers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 bg-[#0f2744]/50 rounded-xl border border-gray-700/50">
          <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum provedor configurado</h3>
          <p className="text-gray-400 mb-6">Inicialize os provedores padrão para começar</p>
          <button
            onClick={initializeProviders}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-[#0a1929] rounded-lg font-semibold transition-colors"
            data-testid="init-providers-btn"
          >
            <Plus className="w-5 h-5" /> Inicializar Provedores
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {providers.map(renderProviderCard)}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-[#0f2744]/50 rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📌 Informações Importantes</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
          <div>
            <h4 className="text-amber-400 font-medium mb-2">Stripe</h4>
            <p>Ideal para pagamentos internacionais com cartão de crédito. Suporta múltiplas moedas e tem integração com checkout seguro.</p>
          </div>
          <div>
            <h4 className="text-blue-400 font-medium mb-2">Mercado Pago</h4>
            <p>Solução completa para o Brasil. Suporta PIX, cartão de crédito e débito. Taxas competitivas para o mercado nacional.</p>
          </div>
          <div>
            <h4 className="text-green-400 font-medium mb-2">CORA</h4>
            <p>PIX bancário direto. Ideal para grandes volumes. Requer certificado mTLS para autenticação segura.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
