import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Crown, Mail, Lock, User, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(loginEmail, loginPassword);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (regPassword !== regConfirm) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (regPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    const result = await register(regName, regEmail, regPassword, 'admin');
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#151E32] border border-[#D4AF37]/30 mb-4 gold-glow">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="font-display text-4xl font-bold text-[#F8FAFC] tracking-tight">Hestia</h1>
          <p className="text-[#94A3B8] mt-2 font-body">Plataforma de Gestão Hoteleira</p>
        </div>
        
        <Card className="bg-[#151E32]/80 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-xl text-[#F8FAFC]">Bem-vindo</CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Entre ou crie sua conta para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#0B1120] mb-6">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120] font-semibold"
                  data-testid="login-tab"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120] font-semibold"
                  data-testid="register-tab"
                >
                  Criar Conta
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-[#E8DCC4]">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-[#0B1120]/50 border-white/10 focus:border-[#D4AF37]/50 text-[#F8FAFC] placeholder:text-[#475569]"
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-[#E8DCC4]">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 bg-[#0B1120]/50 border-white/10 focus:border-[#D4AF37]/50 text-[#F8FAFC] placeholder:text-[#475569]"
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <p className="text-red-400 text-sm text-center" data-testid="login-error">{error}</p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold uppercase tracking-widest text-xs py-6 transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                    disabled={isLoading}
                    data-testid="login-submit-btn"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-[#E8DCC4]">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Seu nome"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-10 bg-[#0B1120]/50 border-white/10 focus:border-[#D4AF37]/50 text-[#F8FAFC] placeholder:text-[#475569]"
                        required
                        data-testid="register-name-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-[#E8DCC4]">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10 bg-[#0B1120]/50 border-white/10 focus:border-[#D4AF37]/50 text-[#F8FAFC] placeholder:text-[#475569]"
                        required
                        data-testid="register-email-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-[#E8DCC4]">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10 bg-[#0B1120]/50 border-white/10 focus:border-[#D4AF37]/50 text-[#F8FAFC] placeholder:text-[#475569]"
                        required
                        data-testid="register-password-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm" className="text-[#E8DCC4]">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="reg-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        className="pl-10 bg-[#0B1120]/50 border-white/10 focus:border-[#D4AF37]/50 text-[#F8FAFC] placeholder:text-[#475569]"
                        required
                        data-testid="register-confirm-input"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <p className="text-red-400 text-sm text-center" data-testid="register-error">{error}</p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] font-semibold uppercase tracking-widest text-xs py-6 transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                    disabled={isLoading}
                    data-testid="register-submit-btn"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <p className="text-center text-[#475569] text-xs mt-6">
          &copy; 2024 Hestia Hotel Management. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
