import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Send, 
  Crown,
  Sparkles,
  User,
  Bot,
  Loader2,
  Trash2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatPage = () => {
  const { currentHotel } = useAuth();
  const [activeAgent, setActiveAgent] = useState('hestia');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [hestiaMessages, setHestiaMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou a Hestia, sua assistente de gestão hoteleira. Como posso ajudar você hoje a otimizar as operações do hotel?' }
  ]);
  const [hestiaSessionId, setHestiaSessionId] = useState(null);
  
  const [jarbasMessages, setJarbasMessages] = useState([
    { role: 'assistant', content: 'Boa tarde! Sou Jarbas, o mordomo digital do Grand Hestia Palace. Em que posso ser útil durante sua estadia?' }
  ]);
  const [jarbasSessionId, setJarbasSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [hestiaMessages, jarbasMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { role: 'user', content: message };
    const currentMessages = activeAgent === 'hestia' ? hestiaMessages : jarbasMessages;
    const setMessages = activeAgent === 'hestia' ? setHestiaMessages : setJarbasMessages;
    const sessionId = activeAgent === 'hestia' ? hestiaSessionId : jarbasSessionId;
    const setSessionId = activeAgent === 'hestia' ? setHestiaSessionId : setJarbasSessionId;

    setMessages([...currentMessages, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: message,
        agent_type: activeAgent,
        session_id: sessionId
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      setSessionId(response.data.session_id);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (activeAgent === 'hestia') {
      setHestiaMessages([
        { role: 'assistant', content: 'Olá! Sou a Hestia, sua assistente de gestão hoteleira. Como posso ajudar você hoje?' }
      ]);
      setHestiaSessionId(null);
    } else {
      setJarbasMessages([
        { role: 'assistant', content: 'Boa tarde! Sou Jarbas, o mordomo digital do Grand Hestia Palace. Em que posso ser útil?' }
      ]);
      setJarbasSessionId(null);
    }
  };

  const currentMessages = activeAgent === 'hestia' ? hestiaMessages : jarbasMessages;

  if (!currentHotel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#94A3B8]">Selecione um hotel para usar o assistente IA.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in" data-testid="chat-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">Assistente IA</h1>
        <p className="text-[#94A3B8] mt-1">Converse com nossos assistentes inteligentes</p>
      </div>

      {/* Agent Selector */}
      <Tabs value={activeAgent} onValueChange={setActiveAgent} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-[#151E32]/50 border border-white/10 p-1">
            <TabsTrigger 
              value="hestia" 
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120] gap-2"
              data-testid="hestia-tab"
            >
              <Crown className="w-4 h-4" />
              Hestia
              <span className="text-[10px] opacity-70">Gestão</span>
            </TabsTrigger>
            <TabsTrigger 
              value="jarbas"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0B1120] gap-2"
              data-testid="jarbas-tab"
            >
              <Sparkles className="w-4 h-4" />
              Jarbas
              <span className="text-[10px] opacity-70">Hóspedes</span>
            </TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10"
            data-testid="clear-chat-btn"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>

        <TabsContent value="hestia" className="flex-1 flex flex-col mt-0">
          <AgentInfo 
            name="Hestia" 
            description="Assistente estratégica para gestão hoteleira. Analisa dados, gera insights e apoia decisões." 
            icon={Crown}
            color="gold"
          />
        </TabsContent>

        <TabsContent value="jarbas" className="flex-1 flex flex-col mt-0">
          <AgentInfo 
            name="Jarbas" 
            description="Mordomo digital para atendimento de hóspedes. Elegante, prestativo e disponível 24/7." 
            icon={Sparkles}
            color="blue"
          />
        </TabsContent>

        {/* Chat Area */}
        <Card className="flex-1 bg-[#151E32]/50 border-white/5 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {currentMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activeAgent === 'hestia' ? 'bg-[#D4AF37]/20' : 'bg-blue-400/20'
                    }`}>
                      {activeAgent === 'hestia' ? (
                        <Crown className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-[#D4AF37]/20 text-[#F8FAFC] border border-[#D4AF37]/30' 
                      : 'bg-[#0B1120]/50 text-[#F8FAFC] border border-white/10'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activeAgent === 'hestia' ? 'bg-[#D4AF37]/20' : 'bg-blue-400/20'
                  }`}>
                    <Bot className={`w-4 h-4 ${activeAgent === 'hestia' ? 'text-[#D4AF37]' : 'text-blue-400'}`} />
                  </div>
                  <div className="bg-[#0B1120]/50 border border-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" />
                      <span className="text-sm text-[#94A3B8]">Digitando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Mensagem para ${activeAgent === 'hestia' ? 'Hestia' : 'Jarbas'}...`}
                className="flex-1 bg-[#0B1120]/50 border-white/10 text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#D4AF37]/50"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading}
                className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0B1120] px-6"
                data-testid="send-message-btn"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[#475569] mt-2 text-center">
              Powered by Gemini 3 Flash • As respostas são geradas por IA
            </p>
          </div>
        </Card>
      </Tabs>
    </div>
  );
};

const AgentInfo = ({ name, description, icon: Icon, color }) => (
  <div className={`flex items-center gap-4 p-4 rounded-lg border mb-4 ${
    color === 'gold' 
      ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20' 
      : 'bg-blue-400/5 border-blue-400/20'
  }`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
      color === 'gold' ? 'bg-[#D4AF37]/20' : 'bg-blue-400/20'
    }`}>
      <Icon className={`w-6 h-6 ${color === 'gold' ? 'text-[#D4AF37]' : 'text-blue-400'}`} />
    </div>
    <div>
      <h3 className="font-semibold text-[#F8FAFC]">{name}</h3>
      <p className="text-sm text-[#94A3B8]">{description}</p>
    </div>
  </div>
);

export default ChatPage;
