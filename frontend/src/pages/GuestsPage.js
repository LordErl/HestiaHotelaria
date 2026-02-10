import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { 
  Plus, 
  Search, 
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Star,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuestsPage = () => {
  const { currentHotel } = useAuth();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document_type: 'cpf',
    document_number: '',
    nationality: 'BR',
    address: '',
    city: '',
    country: 'Brasil',
    notes: ''
  });

  const fetchGuests = useCallback(async () => {
    if (!currentHotel) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API}/guests?hotel_id=${currentHotel.id}${searchTerm ? `&search=${searchTerm}` : ''}`);
      setGuests(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentHotel, searchTerm]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchGuests();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchGuests]);

  const handleCreateGuest = async () => {
    if (!currentHotel || !formData.name || !formData.document_number) {
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API}/guests?hotel_id=${currentHotel.id}`, formData);
      
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        document_type: 'cpf',
        document_number: '',
        nationality: 'BR',
        address: '',
        city: '',
        country: 'Brasil',
        notes: ''
      });
      fetchGuests();
    } catch (error) {
      console.error('Create guest error:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!currentHotel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#94A3B8]">Selecione um hotel para ver os hóspedes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="guests-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Hóspedes</h1>
          <p className="text-[#94A3B8] mt-1">Cadastro e histórico de hóspedes</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold"
              data-testid="new-guest-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Hóspede
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#151E32] border-white/10 text-[#F8FAFC] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Cadastrar Hóspede</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Nome Completo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do hóspede"
                  className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                  data-testid="guest-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                    data-testid="guest-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+55 11 99999-0000"
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                    data-testid="guest-phone-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Tipo de Documento</Label>
                  <Input
                    value={formData.document_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                    placeholder="CPF"
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                    data-testid="guest-doctype-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Número do Documento *</Label>
                  <Input
                    value={formData.document_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                    data-testid="guest-docnum-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, complemento"
                  className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                  data-testid="guest-address-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="São Paulo"
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                    data-testid="guest-city-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#E8DCC4]">País</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Brasil"
                    className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
                    data-testid="guest-country-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#E8DCC4]">Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Preferências, alergias, etc..."
                  className="bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569] min-h-[80px]"
                  data-testid="guest-notes-textarea"
                />
              </div>

              <Button
                onClick={handleCreateGuest}
                disabled={creating || !formData.name || !formData.document_number}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold"
                data-testid="create-guest-btn"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar Hóspede'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <Input
          placeholder="Buscar por nome, email ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#151E32]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569]"
          data-testid="search-guests-input"
        />
      </div>

      {/* Guests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#151E32]/50 border-white/5 animate-pulse">
              <CardContent className="p-6 h-48" />
            </Card>
          ))}
        </div>
      ) : guests.length === 0 ? (
        <Card className="bg-[#151E32]/50 border-white/5">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 mx-auto text-[#94A3B8] mb-4" />
            <p className="text-[#94A3B8]">Nenhum hóspede encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guests.map((guest) => (
            <Card 
              key={guest.id}
              className="bg-[#151E32]/50 border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300"
              data-testid={`guest-card-${guest.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-lg font-bold text-[#D4AF37]">
                      {guest.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#F8FAFC] truncate">{guest.name}</h3>
                      {guest.vip_status && (
                        <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] uppercase">{guest.document_type}: {guest.document_number}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <Phone className="w-4 h-4" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.city && (
                    <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <MapPin className="w-4 h-4" />
                      <span>{guest.city}, {guest.country}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-[#F8FAFC]">{guest.total_stays || 0}</p>
                      <p className="text-xs text-[#94A3B8]">Estadias</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-[#D4AF37]">
                        R$ {(guest.total_spent || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-[#94A3B8]">Total Gasto</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestsPage;
