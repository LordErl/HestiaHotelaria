import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Bell,
  Users,
  BedDouble,
  ClipboardList,
  LogIn,
  LogOut,
  Loader2,
  RefreshCw,
  Home,
  Settings,
  MessageSquare
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TASK_PRIORITIES = {
  urgent: { label: 'Urgente', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high: { label: 'Alta', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  normal: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  low: { label: 'Baixa', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
};

const MobileStaffPage = () => {
  const { token, user, currentHotel } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [dashboard, setDashboard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const hotelId = currentHotel?.id;

  useEffect(() => {
    if (hotelId) {
      loadDashboard();
    }
  }, [hotelId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mobile/staff/dashboard?hotel_id=${hotelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setDashboard(await response.json());
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
    toast.success('Dados atualizados!');
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/mobile/staff/task/${taskId}?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Tarefa atualizada!');
        loadDashboard();
      }
    } catch (error) {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] pb-20" data-testid="mobile-staff-page">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#D4AF37]/20 to-transparent p-6 pt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#94A3B8] text-sm">Olá,</p>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">{user?.name || 'Colaborador'}</h1>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            className="border-white/10"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-[#94A3B8] ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#151E32]/80 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-lg font-bold text-[#F8FAFC]">{dashboard?.today?.check_ins || 0}</p>
                  <p className="text-xs text-[#94A3B8]">Check-ins Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/80 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-lg font-bold text-[#F8FAFC]">{dashboard?.today?.check_outs || 0}</p>
                  <p className="text-xs text-[#94A3B8]">Check-outs Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/80 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-lg font-bold text-[#F8FAFC]">{dashboard?.today?.pending_housekeeping || 0}</p>
                  <p className="text-xs text-[#94A3B8]">Limpezas Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/80 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-lg font-bold text-[#F8FAFC]">{dashboard?.today?.guest_requests || 0}</p>
                  <p className="text-xs text-[#94A3B8]">Solicitações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 bg-[#151E32]/50 border border-white/10 w-full">
            <TabsTrigger value="tasks" className="text-xs data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
              Solicitações
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
              Alertas
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4 space-y-3">
            {dashboard?.tasks?.length === 0 ? (
              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-3" />
                  <p className="text-[#F8FAFC] font-medium">Tudo em dia!</p>
                  <p className="text-sm text-[#94A3B8]">Nenhuma tarefa pendente</p>
                </CardContent>
              </Card>
            ) : (
              dashboard?.tasks?.map((task, i) => {
                const priority = TASK_PRIORITIES[task.priority] || TASK_PRIORITIES.normal;
                return (
                  <Card key={i} className="bg-[#151E32]/50 border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                            <BedDouble className="w-5 h-5 text-[#D4AF37]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#F8FAFC]">Quarto {task.room_number || task.room_id?.slice(0, 4)}</p>
                            <p className="text-sm text-[#94A3B8]">{task.task_type || 'Limpeza'}</p>
                          </div>
                        </div>
                        <Badge className={priority.color}>{priority.label}</Badge>
                      </div>
                      
                      {task.notes && (
                        <p className="text-sm text-[#94A3B8] mb-3">{task.notes}</p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-blue-500/30 text-blue-400"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Iniciar
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Concluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-4 space-y-3">
            {dashboard?.requests?.length === 0 ? (
              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-[#94A3B8] mb-3" />
                  <p className="text-[#F8FAFC] font-medium">Nenhuma solicitação</p>
                  <p className="text-sm text-[#94A3B8]">As solicitações de hóspedes aparecerão aqui</p>
                </CardContent>
              </Card>
            ) : (
              dashboard?.requests?.map((request, i) => (
                <Card key={i} className="bg-[#151E32]/50 border-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium text-[#F8FAFC]">{request.request_type}</p>
                          <p className="text-xs text-[#94A3B8]">Quarto {request.room_id?.slice(0, 4)}</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pendente
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-[#94A3B8] mb-3">{request.details}</p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
                      >
                        Atender
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-4 space-y-3">
            {dashboard?.alerts?.length === 0 ? (
              <Card className="bg-[#151E32]/50 border-white/5">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-[#94A3B8] mb-3" />
                  <p className="text-[#F8FAFC] font-medium">Sem alertas</p>
                  <p className="text-sm text-[#94A3B8]">Nenhum alerta no momento</p>
                </CardContent>
              </Card>
            ) : (
              dashboard?.alerts?.map((alert, i) => (
                <Card key={i} className="bg-[#151E32]/50 border-red-500/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-[#F8FAFC]">{alert.message}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#151E32] border-t border-white/10 px-6 py-3">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-[#D4AF37]">
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#94A3B8]">
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Tarefas</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#94A3B8]">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#94A3B8]">
            <Settings className="w-5 h-5" />
            <span className="text-xs">Config</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileStaffPage;
