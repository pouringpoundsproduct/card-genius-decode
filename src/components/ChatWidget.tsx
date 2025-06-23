
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Calculator, PenTool, CreditCard } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  source?: string;
  timestamp: Date;
}

interface SpendingData {
  amazon_spends: number;
  flipkart_spends: number;
  grocery_spends_online: number;
  online_food_ordering: number;
  other_online_spends: number;
  other_offline_spends: number;
  dining_or_going_out: number;
  fuel: number;
  school_fees: number;
  rent: number;
  mobile_phone_bills: number;
  electricity_bills: number;
  water_bills: number;
  ott_channels: number;
  hotels_annual: number;
  flights_annual: number;
  insurance_health_annual: number;
  insurance_car_or_bike_annual: number;
  large_electronics_purchase_like_mobile_tv_etc: number;
  all_pharmacy: number;
  domestic_lounge_usage_quarterly: number;
  international_lounge_usage_quarterly: number;
  railway_lounge_usage_quarterly: number;
  movie_usage: number;
  movie_mov: number;
  dining_usage: number;
  dining_mov: number;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '🎯 Hi! I\'m your Advanced Credit Card Assistant powered by BankKaro & ChatGPT!\n\n✨ I can help you:\n• Find perfect credit cards\n• Analyze spending patterns\n• Create content for social media\n• Compare cards & benefits\n• Get personalized recommendations\n\nWhat would you like to explore today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSpendingForm, setShowSpendingForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          context: 'Enhanced Credit card assistance with BankKaro integration'
        }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        source: data.source,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting. Please make sure the backend server is running on http://localhost:4000',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleSpendingAnalysis = () => {
    setShowSpendingForm(true);
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  const quickActions = [
    {
      icon: <CreditCard className="h-4 w-4" />,
      text: 'Find best credit cards for travel',
      action: 'travel'
    },
    {
      icon: <Calculator className="h-4 w-4" />,
      text: 'Analyze my spending',
      action: 'spending',
      onClick: handleSpendingAnalysis
    },
    {
      icon: <PenTool className="h-4 w-4" />,
      text: 'Create social media content',
      action: 'content'
    }
  ];

  const enhancedQuickActions = [
    'Best cashback credit cards in India',
    'Compare HDFC vs SBI credit cards',
    'Create Instagram post about credit card benefits',
    'Fuel credit cards with lowest fees',
    'Premium credit cards with airport lounge access',
    'Write article about credit card rewards'
  ];

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
            <p className="text-blue-100 text-sm">BankKaro + ChatGPT Integration</p>
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
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  {message.source && (
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {message.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quick Actions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-600 mb-3 font-medium">🚀 Quick Actions:</p>
              
              {/* Feature buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {quickActions.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick || (() => handleQuickAction(item.text))}
                    className="flex items-center gap-2 text-xs p-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded transition-colors border border-blue-200"
                  >
                    {item.icon}
                    <span className="truncate">{item.text}</span>
                  </button>
                ))}
              </div>
              
              {/* Text suggestions */}
              <div className="space-y-1">
                {enhancedQuickActions.slice(0, 4).map((action, index) => (
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about credit cards, spending analysis, or content creation..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
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
