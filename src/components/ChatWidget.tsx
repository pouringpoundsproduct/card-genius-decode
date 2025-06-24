
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Calculator, PenTool, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  source?: string;
  timestamp: Date;
  error?: boolean;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '🎯 Hi! I\'m your Advanced Credit Card Assistant powered by ChatGPT & BankKaro!\n\n✨ I can help you:\n• Find perfect credit cards\n• Get expert advice on banking\n• Compare cards & benefits\n• Create content for social media\n• Analyze spending patterns\n• Get personalized recommendations\n\nWhat would you like to explore today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check backend connection when widget opens
  useEffect(() => {
    if (isOpen) {
      checkBackendConnection();
    }
  }, [isOpen]);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:4000/health');
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'Enhanced Credit card assistance with ChatGPT and BankKaro integration'
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        source: data.source || 'ChatGPT',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Sorry, I\'m having trouble connecting. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += 'Please make sure the backend server is running on http://localhost:4000';
        } else {
          errorMessage += error.message;
        }
      }

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorBotMessage]);
      setConnectionStatus('error');
    }

    setIsLoading(false);
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  const quickActions = [
    'Best credit cards for travel rewards',
    'Compare HDFC vs SBI credit cards',
    'What is a good credit score in India?',
    'Create Instagram post about credit card benefits',
    'Fuel credit cards with lowest annual fee',
    'Premium cards with airport lounge access'
  ];

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'checking':
        return { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Connecting...', color: 'text-yellow-400' };
      case 'connected':
        return { icon: <CheckCircle className="h-4 w-4" />, text: 'ChatGPT Ready', color: 'text-green-400' };
      case 'error':
        return { icon: <AlertCircle className="h-4 w-4" />, text: 'Connection Error', color: 'text-red-400' };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <>
      {/* Enhanced Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-200 transform hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Card AI Assistant
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-blue-100 text-sm">Powered by ChatGPT & BankKaro</p>
              <div className={`flex items-center gap-1 text-xs ${statusDisplay.color}`}>
                {statusDisplay.icon}
                <span>{statusDisplay.text}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : message.error
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  {message.source && !message.error && (
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      💬 {message.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">ChatGPT is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-600 mb-3 font-medium">🚀 Try these questions:</p>
              
              <div className="space-y-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-gray-700"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Input */}
          <div className="p-4 border-t border-gray-200">
            {connectionStatus === 'error' && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                Backend connection failed. Please ensure the server is running.
              </div>
            )}
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask ChatGPT about credit cards..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || connectionStatus === 'error'}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || connectionStatus === 'error'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
