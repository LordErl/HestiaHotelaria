import React, { useState } from 'react';
import axios from 'axios';
import { Building2, User, Mail, Lock, Phone, MapPin, FileText, CreditCard, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HotelRegistrationPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 - Hotel Data
    hotel_name: '',
    hotel_address: '',
    hotel_city: '',
    hotel_country: 'Brasil',
    hotel_phone: '',
    hotel_email: '',
    hotel_stars: 3,
    hotel_description: '',
    
    // Step 2 - Admin Data
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: '',
    
    // Step 3 - Organization (PJ)
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    endereco_fiscal: '',
    cidade_fiscal: '',
    estado_fiscal: '',
    cep: '',
    telefone_comercial: '',
    email_financeiro: '',
    
    // Step 4 - Responsible
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_cargo: '',
    responsavel_telefone: '',
    responsavel_email: '',
    
    // Step 5 - Bank
    banco_nome: '',
    banco_agencia: '',
    banco_conta: '',
    banco_tipo_conta: 'corrente',
    banco_pix_chave: '',
    
    // Plan
    plano_assinatura: 'starter'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  };

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d{3}).*/, '$1-$2');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validate passwords
    if (formData.admin_password !== formData.admin_password_confirm) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        hotel_name: formData.hotel_name,
        hotel_address: formData.hotel_address,
        hotel_city: formData.hotel_city,
        hotel_country: formData.hotel_country,
        hotel_phone: formData.hotel_phone,
        hotel_email: formData.hotel_email,
        hotel_stars: parseInt(formData.hotel_stars),
        hotel_description: formData.hotel_description,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        organization: {
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          cnpj: formData.cnpj.replace(/\D/g, ''),
          inscricao_estadual: formData.inscricao_estadual,
          endereco_fiscal: formData.endereco_fiscal,
          cidade: formData.cidade_fiscal,
          estado: formData.estado_fiscal,
          cep: formData.cep.replace(/\D/g, ''),
          telefone_comercial: formData.telefone_comercial,
          email_financeiro: formData.email_financeiro,
          responsavel_nome: formData.responsavel_nome,
          responsavel_cpf: formData.responsavel_cpf.replace(/\D/g, ''),
          responsavel_cargo: formData.responsavel_cargo,
          responsavel_telefone: formData.responsavel_telefone,
          responsavel_email: formData.responsavel_email,
          banco_nome: formData.banco_nome,
          banco_agencia: formData.banco_agencia,
          banco_conta: formData.banco_conta,
          banco_tipo_conta: formData.banco_tipo_conta,
          banco_pix_chave: formData.banco_pix_chave,
          plano_assinatura: formData.plano_assinatura
        }
      };

      const response = await axios.post(`${API}/platform/register-hotel`, payload);
      
      if (response.data.access_token) {
        setSuccess(true);
        // Auto login
        localStorage.setItem('hestia_token', response.data.access_token);
        setTimeout(() => {
          window.location.href = '/hestia/';
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao registrar hotel');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'starter', name: 'Starter', price: 'R$ 299/mês', features: ['Até 30 quartos', 'Motor de Reservas', 'Suporte por email'] },
    { id: 'professional', name: 'Professional', price: 'R$ 599/mês', features: ['Até 100 quartos', 'Integração OTAs', 'Revenue Management', 'Suporte prioritário'] },
    { id: 'enterprise', name: 'Enterprise', price: 'Sob consulta', features: ['Quartos ilimitados', 'API personalizada', 'Gerente de conta dedicado', 'SLA garantido'] }
  ];

  const steps = [
    { id: 1, title: 'Dados do Hotel', icon: Building2 },
    { id: 2, title: 'Administrador', icon: User },
    { id: 3, title: 'Pessoa Jurídica', icon: FileText },
    { id: 4, title: 'Responsável Legal', icon: User },
    { id: 5, title: 'Dados Bancários', icon: CreditCard },
    { id: 6, title: 'Plano', icon: Check }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
        <div className="bg-velvet rounded-xl p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-playfair text-white mb-4">Cadastro Realizado!</h2>
          <p className="text-slate-400 mb-6">Seu hotel foi cadastrado com sucesso na plataforma Hestia. Você será redirecionado para o painel de gestão.</p>
          <div className="text-gold animate-pulse">Redirecionando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex">
      {/* Sidebar - Steps */}
      <div className="w-80 bg-velvet/50 border-r border-white/5 p-8">
        <div className="flex items-center gap-3 mb-12">
          <Building2 className="w-8 h-8 text-gold" />
          <span className="text-xl font-playfair text-white">Hestia</span>
        </div>

        <div className="space-y-4">
          {steps.map((s, index) => (
            <div 
              key={s.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                step === s.id ? 'bg-gold/10 border border-gold/20' : 
                step > s.id ? 'bg-emerald-500/10' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === s.id ? 'bg-gold text-obsidian' : 
                step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <div>
                <div className={`text-sm ${step === s.id ? 'text-gold' : step > s.id ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Passo {s.id}
                </div>
                <div className={`font-medium ${step === s.id ? 'text-white' : step > s.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  {s.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-slate-500 text-sm">
            Já tem uma conta?{' '}
            <a href="/hestia/login" className="text-gold hover:underline">Fazer login</a>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Step 1 - Hotel Data */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-playfair text-white mb-2">Dados do Hotel</h2>
                <p className="text-slate-400">Informações básicas do seu estabelecimento</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Nome do Hotel *</label>
                  <input
                    type="text"
                    name="hotel_name"
                    value={formData.hotel_name}
                    onChange={handleChange}
                    placeholder="Ex: Grand Hotel São Paulo"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    data-testid="hotel-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Cidade *</label>
                    <input
                      type="text"
                      name="hotel_city"
                      value={formData.hotel_city}
                      onChange={handleChange}
                      placeholder="São Paulo"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">País</label>
                    <input
                      type="text"
                      name="hotel_country"
                      value={formData.hotel_country}
                      onChange={handleChange}
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Endereço *</label>
                  <input
                    type="text"
                    name="hotel_address"
                    value={formData.hotel_address}
                    onChange={handleChange}
                    placeholder="Av. Paulista, 1000"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                    <input
                      type="text"
                      name="hotel_phone"
                      value={formData.hotel_phone}
                      onChange={(e) => handleChange({ target: { name: 'hotel_phone', value: formatPhone(e.target.value) }})}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      name="hotel_email"
                      value={formData.hotel_email}
                      onChange={handleChange}
                      placeholder="contato@hotel.com"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Categoria (Estrelas)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, hotel_stars: star }))}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                          formData.hotel_stars >= star ? 'bg-gold text-obsidian' : 'bg-velvet text-slate-500'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                  <textarea
                    name="hotel_description"
                    value={formData.hotel_description}
                    onChange={handleChange}
                    placeholder="Descreva seu hotel..."
                    rows={3}
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Admin Data */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-playfair text-white mb-2">Administrador do Hotel</h2>
                <p className="text-slate-400">Dados de acesso do administrador principal</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    name="admin_name"
                    value={formData.admin_name}
                    onChange={handleChange}
                    placeholder="João Silva"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    data-testid="admin-name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email *</label>
                  <input
                    type="email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleChange}
                    placeholder="admin@seuhotel.com"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    data-testid="admin-email"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Senha *</label>
                  <input
                    type="password"
                    name="admin_password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    data-testid="admin-password"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Confirmar Senha *</label>
                  <input
                    type="password"
                    name="admin_password_confirm"
                    value={formData.admin_password_confirm}
                    onChange={handleChange}
                    placeholder="Repita a senha"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Organization */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-playfair text-white mb-2">Dados da Pessoa Jurídica</h2>
                <p className="text-slate-400">Informações da empresa responsável pelo hotel</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Razão Social *</label>
                  <input
                    type="text"
                    name="razao_social"
                    value={formData.razao_social}
                    onChange={handleChange}
                    placeholder="Hotel São Paulo Ltda"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    data-testid="razao-social"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Nome Fantasia</label>
                  <input
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                    placeholder="Grand Hotel SP"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">CNPJ *</label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleChange({ target: { name: 'cnpj', value: formatCNPJ(e.target.value) }})}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                      data-testid="cnpj"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Inscrição Estadual</label>
                    <input
                      type="text"
                      name="inscricao_estadual"
                      value={formData.inscricao_estadual}
                      onChange={handleChange}
                      placeholder="000.000.000.000"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Endereço Fiscal</label>
                  <input
                    type="text"
                    name="endereco_fiscal"
                    value={formData.endereco_fiscal}
                    onChange={handleChange}
                    placeholder="Av. Paulista, 1000, Sala 101"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Cidade</label>
                    <input
                      type="text"
                      name="cidade_fiscal"
                      value={formData.cidade_fiscal}
                      onChange={handleChange}
                      placeholder="São Paulo"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Estado</label>
                    <input
                      type="text"
                      name="estado_fiscal"
                      value={formData.estado_fiscal}
                      onChange={handleChange}
                      placeholder="SP"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={(e) => handleChange({ target: { name: 'cep', value: formatCEP(e.target.value) }})}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Telefone Comercial</label>
                    <input
                      type="text"
                      name="telefone_comercial"
                      value={formData.telefone_comercial}
                      onChange={(e) => handleChange({ target: { name: 'telefone_comercial', value: formatPhone(e.target.value) }})}
                      placeholder="(11) 3000-0000"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email Financeiro</label>
                    <input
                      type="email"
                      name="email_financeiro"
                      value={formData.email_financeiro}
                      onChange={handleChange}
                      placeholder="financeiro@empresa.com"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Responsible */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-playfair text-white mb-2">Responsável Legal</h2>
                <p className="text-slate-400">Dados do representante legal da empresa</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    name="responsavel_nome"
                    value={formData.responsavel_nome}
                    onChange={handleChange}
                    placeholder="Maria Silva"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    data-testid="responsavel-nome"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">CPF *</label>
                    <input
                      type="text"
                      name="responsavel_cpf"
                      value={formData.responsavel_cpf}
                      onChange={(e) => handleChange({ target: { name: 'responsavel_cpf', value: formatCPF(e.target.value) }})}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                      data-testid="responsavel-cpf"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Cargo</label>
                    <input
                      type="text"
                      name="responsavel_cargo"
                      value={formData.responsavel_cargo}
                      onChange={handleChange}
                      placeholder="Diretor(a)"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                    <input
                      type="text"
                      name="responsavel_telefone"
                      value={formData.responsavel_telefone}
                      onChange={(e) => handleChange({ target: { name: 'responsavel_telefone', value: formatPhone(e.target.value) }})}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      name="responsavel_email"
                      value={formData.responsavel_email}
                      onChange={handleChange}
                      placeholder="responsavel@empresa.com"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 - Bank */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-playfair text-white mb-2">Dados Bancários</h2>
                <p className="text-slate-400">Informações para recebimento de pagamentos</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Banco</label>
                  <input
                    type="text"
                    name="banco_nome"
                    value={formData.banco_nome}
                    onChange={handleChange}
                    placeholder="Banco do Brasil"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Agência</label>
                    <input
                      type="text"
                      name="banco_agencia"
                      value={formData.banco_agencia}
                      onChange={handleChange}
                      placeholder="0001"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Conta</label>
                    <input
                      type="text"
                      name="banco_conta"
                      value={formData.banco_conta}
                      onChange={handleChange}
                      placeholder="12345-6"
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Tipo</label>
                    <select
                      name="banco_tipo_conta"
                      value={formData.banco_tipo_conta}
                      onChange={handleChange}
                      className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none"
                    >
                      <option value="corrente">Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Chave PIX</label>
                  <input
                    type="text"
                    name="banco_pix_chave"
                    value={formData.banco_pix_chave}
                    onChange={handleChange}
                    placeholder="CNPJ, Email, Telefone ou Chave aleatória"
                    className="w-full bg-obsidian/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6 - Plan */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-playfair text-white mb-2">Escolha seu Plano</h2>
                <p className="text-slate-400">Selecione o plano ideal para o seu hotel</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setFormData(prev => ({ ...prev, plano_assinatura: plan.id }))}
                    className={`p-6 rounded-xl cursor-pointer transition-all ${
                      formData.plano_assinatura === plan.id 
                        ? 'bg-gold/10 border-2 border-gold' 
                        : 'bg-velvet border border-white/10 hover:border-gold/30'
                    }`}
                    data-testid={`plan-${plan.id}`}
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                    <div className="text-2xl font-playfair text-gold mb-4">{plan.price}</div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 text-center">
                <p className="text-gold text-sm">
                  Todos os planos incluem 14 dias de teste grátis. Cancele quando quiser.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-6 py-3 bg-velvet text-slate-300 rounded-lg hover:bg-velvet/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors"
                data-testid="next-step"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                data-testid="submit-registration"
              >
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelRegistrationPage;
