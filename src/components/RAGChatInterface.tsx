import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Send, Bot, User, Star, RefreshCw } from 'lucide-react';

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

interface RAGChatInterfaceProps {
  className?: string;
}

const RAGChatInterface: React.FC<RAGChatInterfaceProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check system status on component mount
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/rag/status');
      const data = await response.json();
      setSystemStatus(data.data);
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

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'api': return 'bg-blue-100 text-blue-800';
      case 'mitc': return 'bg-green-100 text-green-800';
      case 'openai': return 'bg-purple-100 text-purple-800';
      case 'fallback': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'api': return '🏦';
      case 'mitc': return '📄';
      case 'openai': return '🤖';
      case 'fallback': return '⚠️';
      case 'error': return '❌';
      default: return '💬';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            RAG Credit Card Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {systemStatus && (
              <Badge variant={systemStatus.system?.isInitialized ? 'default' : 'destructive'}>
                {systemStatus.system?.isInitialized ? 'Online' : 'Offline'}
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
              <p>Ask me anything about credit cards!</p>
              <p className="text-sm">I can help you find the best cards, compare features, and understand terms.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div className={`max-w-[80%] ${message.isUser ? 'order-first' : ''}`}>
                <Card className={message.isUser ? 'bg-primary text-primary-foreground' : ''}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {!message.isUser && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSourceColor(message.source)}>
                            {getSourceIcon(message.source)} {message.source.toUpperCase()}
                          </Badge>
                          {message.confidence > 0 && (
                            <Badge variant="outline">
                              {Math.round(message.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{message.response}</p>

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
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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
    </div>
  );
};

export default RAGChatInterface; 