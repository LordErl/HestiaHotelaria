import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Hotel, DollarSign, TrendingUp, Eye, ChevronRight, Building, FileText, CreditCard, Search, Filter, MoreVertical } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlatformAdminPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/platform/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, [token]);

  const fetchHotels = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/platform/hotels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotels(response.data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/platform/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [token]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/platform/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [token]);

  const fetchHotelDetails = useCallback(async (hotelId) => {
    try {
      const response = await axios.get(`${API}/platform/hotels/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedHotel(response.data);
    } catch (error) {
      console.error('Error fetching hotel details:', error);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchHotels(),
        fetchUsers(),
        fetchOrganizations()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchDashboard, fetchHotels, fetchUsers, fetchOrganizations]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      trial: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return colors[status] || colors.trial;
  };

  const getPlanColor = (plan) => {
    const colors = {
      starter: 'bg-slate-500/20 text-slate-300',
      professional: 'bg-blue-500/20 text-blue-400',
      enterprise: 'bg-gold/20 text-gold'
    };
    return colors[plan] || colors.starter;
  };

  // Check if user is platform admin
  if (!user?.is_platform_admin && user?.email !== 'admin@hestia.com') {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-playfair text-white mb-2">Acesso Restrito</h1>
          <p className="text-slate-400">Esta página é exclusiva para administradores da plataforma Hestia.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-gold text-xl">Carregando dados da plataforma...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-playfair text-white">Painel Admin Hestia</h1>
        </div>
        <p className="text-slate-400">Gestão centralizada de todos os hotéis da plataforma</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'hotels', label: 'Hotéis', icon: Hotel },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'organizations', label: 'Organizações (PJ)', icon: Building }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-gold text-obsidian font-semibold' 
                : 'bg-velvet text-slate-300 hover:bg-velvet/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-velvet/50 border border-white/5 rounded-lg p-6" data-testid="kpi-hotels">
              <div className="flex items-center justify-between mb-4">
                <Hotel className="w-8 h-8 text-gold" />
                <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                  {dashboardData.summary.active_hotels} ativos
                </span>
              </div>
              <div className="text-3xl font-playfair text-white">{dashboardData.summary.total_hotels}</div>
              <div className="text-slate-400 text-sm">Hotéis na Plataforma</div>
            </div>

            <div className="bg-velvet/50 border border-white/5 rounded-lg p-6" data-testid="kpi-users">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                  {dashboardData.summary.hotel_admins} admins
                </span>
              </div>
              <div className="text-3xl font-playfair text-white">{dashboardData.summary.total_users}</div>
              <div className="text-slate-400 text-sm">Usuários Totais</div>
            </div>

            <div className="bg-velvet/50 border border-white/5 rounded-lg p-6" data-testid="kpi-reservations">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-playfair text-white">{dashboardData.summary.total_reservations}</div>
              <div className="text-slate-400 text-sm">Total de Reservas</div>
            </div>

            <div className="bg-velvet/50 border border-white/5 rounded-lg p-6" data-testid="kpi-revenue">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-3xl font-playfair text-gold">{formatCurrency(dashboardData.summary.total_revenue)}</div>
              <div className="text-slate-400 text-sm">Receita Total (GMV)</div>
            </div>
          </div>

          {/* MRR Card */}
          <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <CreditCard className="w-12 h-12 text-gold" />
              <div>
                <div className="text-sm text-gold/80 uppercase tracking-widest">MRR - Receita Recorrente Mensal</div>
                <div className="text-4xl font-playfair text-white">{formatCurrency(dashboardData.financeiro.mrr)}</div>
              </div>
            </div>
          </div>

          {/* Hotels by Plan */}
          <div className="bg-velvet/50 border border-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hotéis por Plano</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(dashboardData.financeiro.hotels_by_plan || {}).map(([plan, count]) => (
                <div key={plan} className={`rounded-lg p-4 ${getPlanColor(plan)}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm capitalize">{plan}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Hotels */}
          <div className="bg-velvet/50 border border-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hotéis Recentes</h3>
            <div className="space-y-3">
              {dashboardData.hotels.map(hotel => (
                <div key={hotel.id} className="flex items-center justify-between p-3 bg-obsidian/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{hotel.name}</div>
                    <div className="text-sm text-slate-400">{hotel.city}</div>
                  </div>
                  <div className="text-slate-400 text-sm">{formatDate(hotel.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hotels Tab */}
      {activeTab === 'hotels' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar hotéis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-velvet border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                data-testid="search-hotels"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-velvet border border-white/10 rounded-lg text-slate-300 hover:bg-velvet/80">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hotels
              .filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.city?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(hotel => (
                <div 
                  key={hotel.id} 
                  className="bg-velvet/50 border border-white/5 rounded-lg p-6 hover:border-gold/20 transition-colors cursor-pointer"
                  onClick={() => fetchHotelDetails(hotel.id)}
                  data-testid={`hotel-card-${hotel.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{hotel.name}</h3>
                      <p className="text-slate-400 text-sm">{hotel.city}, {hotel.country}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(hotel.stars || 0)].map((_, i) => (
                        <span key={i} className="text-gold">★</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-semibold text-white">{hotel.total_rooms || 0}</div>
                      <div className="text-xs text-slate-400">Quartos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-white">{hotel.total_users || 0}</div>
                      <div className="text-xs text-slate-400">Usuários</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(hotel.organization?.status_contrato || 'trial')}`}>
                        {hotel.organization?.status_contrato || 'trial'}
                      </div>
                    </div>
                  </div>

                  {hotel.organization && (
                    <div className="pt-4 border-t border-white/5">
                      <div className="text-sm text-slate-400">
                        <span className="text-slate-500">CNPJ:</span> {hotel.organization.cnpj}
                      </div>
                      <div className="text-sm text-slate-400">
                        <span className="text-slate-500">Plano:</span>{' '}
                        <span className={`px-2 py-0.5 rounded ${getPlanColor(hotel.organization.plano_assinatura)}`}>
                          {hotel.organization.plano_assinatura}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-4 text-gold text-sm">
                    Ver detalhes <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-velvet/50 border border-white/5 rounded-lg overflow-hidden">
          <table className="w-full" data-testid="users-table">
            <thead className="bg-obsidian/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Função</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Hotel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-obsidian/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-medium">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white">{user.name}</span>
                      {(user.is_platform_admin || user.email === 'admin@hestia.com') && (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">ADMIN PLATAFORMA</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm px-2 py-1 rounded bg-slate-500/20 text-slate-300 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{user.hotel_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          {organizations.length === 0 ? (
            <div className="bg-velvet/50 border border-white/5 rounded-lg p-12 text-center">
              <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-white mb-2">Nenhuma organização cadastrada</h3>
              <p className="text-slate-400">Quando novos hotéis se registrarem na plataforma, seus dados de pessoa jurídica aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {organizations.map(org => (
                <div key={org.id} className="bg-velvet/50 border border-white/5 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{org.razao_social}</h3>
                      <p className="text-slate-400">{org.nome_fantasia}</p>
                      <p className="text-sm text-slate-500">Hotel: {org.hotel_name}</p>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(org.status_contrato)}`}>
                      {org.status_contrato}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">CNPJ</div>
                      <div className="text-white">{org.cnpj}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Responsável</div>
                      <div className="text-white">{org.responsavel_nome}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Plano</div>
                      <div className={`inline-block px-2 py-0.5 rounded ${getPlanColor(org.plano_assinatura)}`}>
                        {org.plano_assinatura}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Mensalidade</div>
                      <div className="text-gold font-semibold">{formatCurrency(org.valor_mensalidade)}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">Email Financeiro</div>
                      <div className="text-slate-300">{org.email_financeiro || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Telefone</div>
                      <div className="text-slate-300">{org.telefone_comercial || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Início Contrato</div>
                      <div className="text-slate-300">{formatDate(org.data_inicio_contrato)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Fim Contrato</div>
                      <div className="text-slate-300">{formatDate(org.data_fim_contrato)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hotel Details Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHotel(null)}>
          <div className="bg-velvet rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-playfair text-white">{selectedHotel.name}</h2>
                  <p className="text-slate-400">{selectedHotel.city}, {selectedHotel.country}</p>
                </div>
                <button onClick={() => setSelectedHotel(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-obsidian/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{selectedHotel.stats?.total_rooms}</div>
                  <div className="text-sm text-slate-400">Quartos</div>
                </div>
                <div className="bg-obsidian/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{selectedHotel.stats?.total_users}</div>
                  <div className="text-sm text-slate-400">Usuários</div>
                </div>
                <div className="bg-obsidian/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{selectedHotel.stats?.total_reservations}</div>
                  <div className="text-sm text-slate-400">Reservas</div>
                </div>
                <div className="bg-obsidian/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-gold">{formatCurrency(selectedHotel.stats?.total_revenue)}</div>
                  <div className="text-sm text-slate-400">Receita</div>
                </div>
              </div>

              {/* Organization */}
              {selectedHotel.organization && (
                <div className="bg-obsidian/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Dados da Organização</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Razão Social:</span>
                      <span className="text-white ml-2">{selectedHotel.organization.razao_social}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">CNPJ:</span>
                      <span className="text-white ml-2">{selectedHotel.organization.cnpj}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Responsável:</span>
                      <span className="text-white ml-2">{selectedHotel.organization.responsavel_nome}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">CPF:</span>
                      <span className="text-white ml-2">{selectedHotel.organization.responsavel_cpf}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Users */}
              <div className="bg-obsidian/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Usuários ({selectedHotel.users?.length})</h3>
                <div className="space-y-2">
                  {selectedHotel.users?.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2 bg-velvet/50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white text-sm">{u.name}</div>
                          <div className="text-slate-400 text-xs">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-500/20 rounded text-slate-300 capitalize">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reservations */}
              <div className="bg-obsidian/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Reservas Recentes</h3>
                <div className="space-y-2">
                  {selectedHotel.recent_reservations?.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-velvet/50 rounded">
                      <div className="text-sm">
                        <div className="text-white">{r.confirmation_code || r.id.slice(0, 8)}</div>
                        <div className="text-slate-400 text-xs">{r.check_in_date} - {r.check_out_date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gold text-sm">{formatCurrency(r.total_amount)}</div>
                        <div className="text-xs text-slate-400 capitalize">{r.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminPage;
