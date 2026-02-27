import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Wrench, Plus, Filter, Clock, CheckCircle, AlertTriangle, User, Building, X, ChevronDown, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MaintenancePage = () => {
  const { token, currentHotel } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    prioridade: 'normal',
    room_id: ''
  });

  const categorias = [
    'Elétrica',
    'Hidráulica',
    'Ar Condicionado',
    'Mobília',
    'TV/Eletrônicos',
    'Fechadura/Chave',
    'Limpeza Especial',
    'Pintura',
    'Outros'
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa', color: 'bg-slate-500' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
    { value: 'alta', label: 'Alta', color: 'bg-amber-500' },
    { value: 'urgente', label: 'Urgente', color: 'bg-red-500' }
  ];

  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    assigned: { label: 'Atribuído', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: User },
    in_progress: { label: 'Em Andamento', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Wrench },
    completed: { label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: X }
  };

  const fetchRequests = useCallback(async () => {
    if (!currentHotel?.id) return;
    
    try {
      let url = `${API}/maintenance/${currentHotel.id}`;
      if (filterStatus !== 'all') {
        url += `?status=${filterStatus}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  }, [token, currentHotel, filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/maintenance`, {
        ...formData,
        hotel_id: currentHotel.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowModal(false);
      setFormData({ titulo: '', descricao: '', categoria: '', prioridade: 'normal', room_id: '' });
      fetchRequests();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await axios.patch(`${API}/maintenance/${requestId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating maintenance request:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = requests.filter(req => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return req.titulo?.toLowerCase().includes(search) || 
             req.descricao?.toLowerCase().includes(search) ||
             req.categoria?.toLowerCase().includes(search);
    }
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-white flex items-center gap-3">
            <Wrench className="w-7 h-7 text-gold" />
            Manutenção
          </h1>
          <p className="text-slate-400 mt-1">Gestão de solicitações de manutenção</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors"
          data-testid="new-maintenance-btn"
        >
          <Plus className="w-5 h-5" />
          Nova Solicitação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-velvet/50 border border-white/5 rounded-lg p-4">
          <div className="text-2xl font-semibold text-white">{stats.total}</div>
          <div className="text-sm text-slate-400">Total</div>
        </div>
        <div className="bg-velvet/50 border border-white/5 rounded-lg p-4">
          <div className="text-2xl font-semibold text-amber-400">{stats.pending}</div>
          <div className="text-sm text-slate-400">Pendentes</div>
        </div>
        <div className="bg-velvet/50 border border-white/5 rounded-lg p-4">
          <div className="text-2xl font-semibold text-purple-400">{stats.in_progress}</div>
          <div className="text-sm text-slate-400">Em Andamento</div>
        </div>
        <div className="bg-velvet/50 border border-white/5 rounded-lg p-4">
          <div className="text-2xl font-semibold text-emerald-400">{stats.completed}</div>
          <div className="text-sm text-slate-400">Concluídos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar solicitações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-velvet border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-velvet border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold/50 focus:outline-none"
          data-testid="status-filter"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendentes</option>
          <option value="assigned">Atribuídos</option>
          <option value="in_progress">Em Andamento</option>
          <option value="completed">Concluídos</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="bg-velvet/50 border border-white/5 rounded-lg overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">Nenhuma solicitação</h3>
            <p className="text-slate-400">Clique em "Nova Solicitação" para criar uma.</p>
          </div>
        ) : (
          <table className="w-full" data-testid="maintenance-table">
            <thead className="bg-obsidian/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Título</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Categoria</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Prioridade</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Data</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRequests.map(request => {
                const StatusIcon = statusConfig[request.status]?.icon || Clock;
                const prioridadeConfig = prioridades.find(p => p.value === request.prioridade);
                
                return (
                  <tr key={request.id} className="hover:bg-obsidian/30" data-testid={`request-${request.id}`}>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{request.titulo}</div>
                      {request.descricao && (
                        <div className="text-sm text-slate-400 truncate max-w-xs">{request.descricao}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{request.categoria || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${prioridadeConfig?.color} text-white`}>
                        {prioridadeConfig?.label || request.prioridade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${statusConfig[request.status]?.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[request.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-gold hover:text-gold/80 text-sm"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-velvet rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-playfair text-white">Nova Solicitação de Manutenção</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Ar condicionado não funciona"
                  required
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  data-testid="maintenance-title"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o problema em detalhes..."
                  rows={3}
                  className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Categoria</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Prioridade</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData(prev => ({ ...prev, prioridade: e.target.value }))}
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none"
                    data-testid="maintenance-priority"
                  >
                    {prioridades.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90"
                  data-testid="submit-maintenance"
                >
                  Criar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-velvet rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-playfair text-white">Detalhes da Solicitação</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-slate-400">Título</div>
                <div className="text-white text-lg">{selectedRequest.titulo}</div>
              </div>

              {selectedRequest.descricao && (
                <div>
                  <div className="text-sm text-slate-400">Descrição</div>
                  <div className="text-slate-300">{selectedRequest.descricao}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Categoria</div>
                  <div className="text-white">{selectedRequest.categoria || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Prioridade</div>
                  <div className="text-white capitalize">{selectedRequest.prioridade}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-2">Status Atual</div>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${statusConfig[selectedRequest.status]?.color}`}>
                  {statusConfig[selectedRequest.status]?.label}
                </span>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-2">Alterar Status</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedRequest.id, status)}
                      disabled={selectedRequest.status === status}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        selectedRequest.status === status 
                          ? 'bg-gold text-obsidian' 
                          : 'bg-obsidian/50 text-slate-300 hover:bg-obsidian/80'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-sm text-slate-400">Criado em</div>
                  <div className="text-slate-300 text-sm">{formatDate(selectedRequest.created_at)}</div>
                </div>
                {selectedRequest.completed_at && (
                  <div>
                    <div className="text-sm text-slate-400">Concluído em</div>
                    <div className="text-slate-300 text-sm">{formatDate(selectedRequest.completed_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
