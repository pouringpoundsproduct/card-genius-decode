import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Send, 
  Bot, 
  User, 
  Star, 
  RefreshCw, 
  Database, 
  FileText, 
  Brain,
  Zap,
  TrendingUp,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';

interface Message {
  id: string;
  query: string;
  response: string;
  source: 'api' | 'mitc' | 'openai' | 'fallback' | 'error';
  confidence: number;
  cards_recommended: any[];
  followup_questions: string[];
  timestamp: string;
  isUser: boolean;
}

interface SystemStats {
  system: {
    isInitialized: boolean;
    activeUsers: number;
    totalConversations: number;
  };
  vectorStore: {
    apiVectorCount: number;
    mitcVectorCount: number;
    totalVectors: number;
  };
  scoring: {
    confidenceThreshold: number;
    feedbackCount: number;
    averageUserRating: number;
  };
}

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}`);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleBackToSearch = () => {
    navigate('/search');
  };

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/rag/status');
      const data = await response.json();
      setSystemStats(data.data);
    } catch (error) {
      console.error('Failed to check system status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      query: inputValue,
      response: '',
      source: 'api',
      confidence: 0,
      cards_recommended: [],
      followup_questions: [],
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/rag/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputValue,
          userId,
          context: {}
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          query: inputValue,
          response: data.data.answer,
          source: data.data.source,
          confidence: data.data.confidence,
          cards_recommended: data.data.cards_recommended || [],
          followup_questions: data.data.followup_questions || [],
          timestamp: data.data.timestamp,
          isUser: false
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        query: inputValue,
        response: 'Sorry, I encountered an error. Please try again.',
        source: 'error',
        confidence: 0,
        cards_recommended: [],
        followup_questions: [],
        timestamp: new Date().toISOString(),
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFollowupQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      await fetch('http://localhost:4000/api/rag/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message.query,
          response: message.response,
          source: message.source,
          rating,
          feedback: ''
        }),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getSourceInfo = (source: string) => {
    switch (source) {
      case 'api':
        return {
          icon: <Database className="h-4 w-4" />,
          label: 'API Data',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Real-time credit card data from BankKaro API'
        };
      case 'mitc':
        return {
          icon: <FileText className="h-4 w-4" />,
          label: 'MITC Documents',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Terms and conditions from official documents'
        };
      case 'openai':
        return {
          icon: <Brain className="h-4 w-4" />,
          label: 'OpenAI AI',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'AI-powered insights and explanations'
        };
      case 'fallback':
        return {
          icon: <Zap className="h-4 w-4" />,
          label: 'Fallback',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'General guidance when specific data unavailable'
        };
      case 'error':
        return {
          icon: <MessageCircle className="h-4 w-4" />,
          label: 'Error',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'System error response'
        };
      default:
        return {
          icon: <MessageCircle className="h-4 w-4" />,
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Unknown data source'
        };
    }
  };

  const suggestedQueries = [
    "Best credit cards for online shopping",
    "Travel cards with lounge access",
    "Compare HDFC Regalia and ICICI Amazon Pay",
    "Cashback cards for fuel and groceries",
    "Premium cards under 5000 annual fee"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={handleBackToSearch}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            AI Credit Card Assistant
          </h1>
          <p className="text-gray-600">
            Get intelligent recommendations and insights about credit cards using our advanced RAG system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat Interface
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {systemStats && (
                      <Badge variant={systemStats.system?.isInitialized ? 'default' : 'destructive'}>
                        {systemStats.system?.isInitialized ? 'Online' : 'Offline'}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkSystemStatus}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Welcome to AI Credit Card Assistant!</p>
                      <p className="text-sm mb-4">Ask me anything about credit cards, and I'll help you find the best options.</p>
                      
                      {/* Suggested Queries */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Try asking:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestedQueries.map((query, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => setInputValue(query)}
                              className="text-xs"
                            >
                              {query}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!message.isUser && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className={`max-w-[80%] ${message.isUser ? 'order-first' : ''}`}>
                        <Card className={message.isUser ? 'bg-blue-600 text-white' : ''}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              {!message.isUser && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={`${getSourceInfo(message.source).color} border`}>
                                    {getSourceInfo(message.source).icon} {getSourceInfo(message.source).label}
                                  </Badge>
                                  {message.confidence > 0 && (
                                    <Badge variant="outline">
                                      {Math.round(message.confidence * 100)}% confidence
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <p className="whitespace-pre-wrap">{message.isUser ? message.query : message.response}</p>

                              {!message.isUser && message.cards_recommended.length > 0 && (
                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                  <p className="text-sm font-medium mb-2">Recommended Cards:</p>
                                  <div className="space-y-1">
                                    {message.cards_recommended.slice(0, 3).map((card, index) => (
                                      <div key={index} className="text-sm">
                                        • {card.name} ({card.bank_name})
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {!message.isUser && message.followup_questions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-2">Follow-up questions:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.followup_questions.map((question, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFollowupQuestion(question)}
                                        className="text-xs"
                                      >
                                        {question}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {!message.isUser && (
                                <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                                  <span className="text-xs text-muted-foreground">Rate this response:</span>
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <Button
                                      key={rating}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFeedback(message.id, rating)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Star className={`h-3 w-3 ${rating <= 3 ? 'fill-yellow-400' : ''}`} />
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {message.isUser && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about credit cards..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* System Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemStats ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge variant={systemStats.system?.isInitialized ? 'default' : 'destructive'}>
                        {systemStats.system?.isInitialized ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Users:</span>
                      <span className="text-sm font-medium">{systemStats.system?.activeUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Conversations:</span>
                      <span className="text-sm font-medium">{systemStats.system?.totalConversations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">API Vectors:</span>
                      <span className="text-sm font-medium">{systemStats.vectorStore?.apiVectorCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">MITC Vectors:</span>
                      <span className="text-sm font-medium">{systemStats.vectorStore?.mitcVectorCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Rating:</span>
                      <span className="text-sm font-medium">{systemStats.scoring?.averageUserRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading system stats...</p>
                )}
              </CardContent>
            </Card>

            {/* Data Sources Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">API Data</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Real-time credit card information</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm">MITC Documents</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Terms and conditions</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">OpenAI AI</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI-powered insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 