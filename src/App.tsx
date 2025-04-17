import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
// @ts-ignore - Ignore TypeScript error for this import
import PodcastSearch from './components/PodcastSearch';
import { processChatMessage, getChatHistory, addToHistory } from './utils/api';
import { Message, ChatHistory } from './types';
import { Headphones, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './styles/chat.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm PodPal, your AI Podcast Recommendation Assistant. I can help you discover amazing podcasts based on your interests, suggest new episodes, and find hidden gems in the podcast world. What kind of podcasts are you looking for today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'search'>('chat');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);

  useEffect(() => {
    // Load chat histories on component mount
    const histories = getChatHistory();
    setChatHistories(histories);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Process message with Gemini
      const response = await processChatMessage(message);
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        isUser: false,
        timestamp: new Date(),
        podcasts: response.podcasts
      };
      setMessages(prev => [...prev, aiMessage]);

      // If this is the first message in a new conversation, create a new history
      if (messages.length === 1) {
        const newHistory: ChatHistory = {
          id: uuidv4(),
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          messages: [...messages, userMessage, aiMessage],
          timestamp: new Date()
        };
        addToHistory(newHistory);
        setChatHistories(prev => [...prev, newHistory]);
      } else {
        // Update the existing history
        const updatedHistories = chatHistories.map(history => {
          if (history.id === chatHistories[chatHistories.length - 1].id) {
            return {
              ...history,
              messages: [...history.messages, userMessage, aiMessage],
              timestamp: new Date()
            };
          }
          return history;
        });
        setChatHistories(updatedHistories);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadHistory = (historyId: string) => {
    const history = chatHistories.find(h => h.id === historyId);
    if (history) {
      setMessages(history.messages);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">
            PodPal: Your AI Podcast Guide
          </h1>
          <p className="text-indigo-600">Discover your next favorite podcast with AI-powered recommendations</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 p-4 flex items-center gap-2 justify-center ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Headphones className="w-5 h-5" />
              <span>Ask PodPal</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 p-4 flex items-center gap-2 justify-center ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Search className="w-5 h-5" />
              <span>Podcast Search</span>
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'chat' ? (
              <div className="h-[500px] flex flex-col">
                <ChatWindow 
                  messages={messages} 
                  isLoading={isLoading}
                  onLoadHistory={handleLoadHistory}
                />
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            ) : (
              <PodcastSearch />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;