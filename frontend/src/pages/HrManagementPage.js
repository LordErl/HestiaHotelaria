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
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  Briefcase,
  Building2,
  DollarSign,
  CalendarDays,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Palmtree
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  vacation: { label: 'Férias', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  leave: { label: 'Afastado', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  terminated: { label: 'Desligado', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

const LEAVE_STATUS = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: 'Aprovado', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-400' }
};

const HrManagementPage = () => {
  const { token, currentHotel } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmployeeOpen, setNewEmployeeOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    document_cpf: '',
    department: '',
    position: '',
    hire_date: '',
    contract_type: 'clt',
    work_shift: 'manha',
    base_salary: ''
  });

  const hotelId = currentHotel?.id;

  useEffect(() => {
    if (hotelId) {
      loadData();
    }
  }, [hotelId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/hr/employees?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/hr/stats?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (employeesRes.ok) {
        setEmployees(await employeesRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (activeTab === 'schedules') {
        const schedulesRes = await fetch(`${API_URL}/api/hr/schedules?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (schedulesRes.ok) {
          setSchedules(await schedulesRes.json());
        }
      }

      if (activeTab === 'leaves') {
        const leavesRes = await fetch(`${API_URL}/api/hr/leave-requests?hotel_id=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (leavesRes.ok) {
          setLeaveRequests(await leavesRes.json());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hr/employees`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          ...employeeForm,
          base_salary: parseFloat(employeeForm.base_salary) || 0
        })
      });

      if (response.ok) {
        toast.success('Funcionário cadastrado com sucesso');
        setNewEmployeeOpen(false);
        setEmployeeForm({
          full_name: '',
          email: '',
          phone: '',
          document_cpf: '',
          department: '',
          position: '',
          hire_date: '',
          contract_type: 'clt',
          work_shift: 'manha',
          base_salary: ''
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erro ao cadastrar funcionário');
      }
    } catch (error) {
      toast.error('Erro ao cadastrar funcionário');
    }
  };

  const approveLeave = async (requestId, approved) => {
    try {
      const response = await fetch(`${API_URL}/api/hr/leave-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved })
      });

      if (response.ok) {
        toast.success(approved ? 'Solicitação aprovada' : 'Solicitação rejeitada');
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao processar solicitação');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="hr-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-3">
            <Users className="w-7 h-7 text-[#D4AF37]" />
            Gestão de Pessoas
          </h1>
          <p className="text-[#94A3B8] mt-1">
            Gerencie funcionários, escalas e solicitações
          </p>
        </div>
        
        <Button 
          onClick={() => setNewEmployeeOpen(true)}
          className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
          data-testid="add-employee-btn"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Total</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.total_employees}</p>
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
                  <p className="text-sm text-[#94A3B8]">Ativos</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.active_employees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Palmtree className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Férias</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.on_vacation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Pendentes</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{stats.pending_leave_requests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-[#94A3B8]">Folha Mensal</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">
                    R$ {stats.total_monthly_payroll?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#151E32]/50 border border-white/5">
          <TabsTrigger value="employees" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Users className="w-4 h-4 mr-2" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <Clock className="w-4 h-4 mr-2" />
            Escalas
          </TabsTrigger>
          <TabsTrigger value="leaves" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]">
            <CalendarDays className="w-4 h-4 mr-2" />
            Férias/Afastamentos
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="mt-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#F8FAFC]">Lista de Funcionários</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    {filteredEmployees.length} funcionários cadastrados
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input 
                      placeholder="Buscar funcionário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#0B1120] border-white/10 text-[#F8FAFC] w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhum funcionário encontrado
                  </h3>
                  <p className="text-[#94A3B8]">
                    Cadastre o primeiro funcionário do hotel
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmployees.map((employee) => (
                    <div 
                      key={employee.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/50 border border-white/5 hover:border-white/10 transition-all"
                      data-testid={`employee-${employee.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#F8FAFC]">{employee.full_name}</h4>
                          <p className="text-sm text-[#94A3B8]">
                            {employee.position} • {employee.department}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-[#94A3B8]">Contrato</p>
                          <p className="text-[#F8FAFC] font-medium uppercase">{employee.contract_type}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-[#94A3B8]">Salário</p>
                          <p className="text-[#D4AF37] font-medium">
                            R$ {employee.base_salary?.toLocaleString('pt-BR') || '-'}
                          </p>
                        </div>
                        
                        <Badge className={STATUS_CONFIG[employee.status]?.color || STATUS_CONFIG.active.color}>
                          {STATUS_CONFIG[employee.status]?.label || 'Ativo'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-[#94A3B8]">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#151E32] border-white/10">
                            <DropdownMenuItem className="text-[#F8FAFC] hover:bg-white/5">
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[#F8FAFC] hover:bg-white/5">
                              <Calendar className="w-4 h-4 mr-2" />
                              Ver Escala
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="mt-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-[#F8FAFC]">Escalas de Trabalho</CardTitle>
              <CardDescription className="text-[#94A3B8]">
                Gerencie as escalas dos funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhuma escala configurada
                  </h3>
                  <p className="text-[#94A3B8]">
                    As escalas serão exibidas aqui quando configuradas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div 
                      key={schedule.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/50 border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-[#F8FAFC]">
                            {new Date(schedule.schedule_date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-[#94A3B8]">
                            {schedule.shift_start} - {schedule.shift_end}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        schedule.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        schedule.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }>
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="mt-6">
          <Card className="bg-[#151E32]/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-[#F8FAFC]">Solicitações de Férias/Afastamentos</CardTitle>
              <CardDescription className="text-[#94A3B8]">
                Aprove ou rejeite solicitações pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Palmtree className="w-16 h-16 mx-auto text-[#94A3B8] mb-4" />
                  <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                    Nenhuma solicitação
                  </h3>
                  <p className="text-[#94A3B8]">
                    As solicitações de férias e afastamentos aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0B1120]/50 border border-white/5"
                      data-testid={`leave-request-${request.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Palmtree className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-[#F8FAFC]">
                            {request.leave_type === 'vacation' ? 'Férias' :
                             request.leave_type === 'sick' ? 'Atestado Médico' :
                             request.leave_type}
                          </p>
                          <p className="text-sm text-[#94A3B8]">
                            {new Date(request.start_date).toLocaleDateString('pt-BR')} - {new Date(request.end_date).toLocaleDateString('pt-BR')}
                            {' • '}{request.total_days} dias
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={LEAVE_STATUS[request.status]?.color || LEAVE_STATUS.pending.color}>
                          {LEAVE_STATUS[request.status]?.label || request.status}
                        </Badge>
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                              onClick={() => approveLeave(request.id, true)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              onClick={() => approveLeave(request.id, false)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Employee Dialog */}
      <Dialog open={newEmployeeOpen} onOpenChange={setNewEmployeeOpen}>
        <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" />
              Novo Funcionário
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Cadastre um novo funcionário no sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-[#94A3B8]">Nome Completo *</Label>
              <Input 
                value={employeeForm.full_name}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="João da Silva"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Email</Label>
              <Input 
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="joao@hotel.com"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Telefone</Label>
              <Input 
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">CPF</Label>
              <Input 
                value={employeeForm.document_cpf}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, document_cpf: e.target.value }))}
                placeholder="000.000.000-00"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Data de Admissão *</Label>
              <Input 
                type="date"
                value={employeeForm.hire_date}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, hire_date: e.target.value }))}
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Departamento *</Label>
              <Select 
                value={employeeForm.department}
                onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  <SelectItem value="recepcao">Recepção</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="restaurante">Restaurante</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Cargo *</Label>
              <Input 
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Recepcionista"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Tipo de Contrato</Label>
              <Select 
                value={employeeForm.contract_type}
                onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, contract_type: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  <SelectItem value="clt">CLT</SelectItem>
                  <SelectItem value="pj">PJ</SelectItem>
                  <SelectItem value="estagio">Estágio</SelectItem>
                  <SelectItem value="temporario">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Turno</Label>
              <Select 
                value={employeeForm.work_shift}
                onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, work_shift: value }))}
              >
                <SelectTrigger className="bg-[#0B1120] border-white/10 text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151E32] border-white/10">
                  <SelectItem value="manha">Manhã (06h-14h)</SelectItem>
                  <SelectItem value="tarde">Tarde (14h-22h)</SelectItem>
                  <SelectItem value="noite">Noite (22h-06h)</SelectItem>
                  <SelectItem value="escala">Escala 12x36</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Salário Base</Label>
              <Input 
                type="number"
                value={employeeForm.base_salary}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, base_salary: e.target.value }))}
                placeholder="3000.00"
                className="bg-[#0B1120] border-white/10 text-[#F8FAFC]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setNewEmployeeOpen(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={createEmployee}
              className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0B1120]"
              disabled={!employeeForm.full_name || !employeeForm.department || !employeeForm.position || !employeeForm.hire_date}
              data-testid="save-employee-btn"
            >
              Cadastrar Funcionário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HrManagementPage;
