import React, { useEffect, useRef } from 'react';
import { Message, ChatHistory } from '../types';
import { getChatHistory } from '../utils/api';
import { Clock, Headphones } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onLoadHistory?: (historyId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onLoadHistory }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [chatHistories, setChatHistories] = React.useState<ChatHistory[]>([]);

  useEffect(() => {
    // Load chat histories
    const histories = getChatHistory();
    setChatHistories(histories);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* History Toggle Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
      >
        <Clock className="w-4 h-4" />
        {showHistory ? 'Hide History' : 'Show History'}
      </button>

      {/* Chat History Panel */}
      {showHistory && (
        <div className="border-b border-indigo-100 p-4 bg-indigo-50">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">Previous Conversations</h3>
          <div className="space-y-2">
            {chatHistories.map(history => (
              <button
                key={history.id}
                onClick={() => {
                  onLoadHistory?.(history.id);
                  setShowHistory(false);
                }}
                className="block w-full text-left p-2 rounded-lg hover:bg-indigo-100 text-sm text-indigo-700"
              >
                <div className="font-medium">{history.title}</div>
                <div className="text-xs text-indigo-500">{formatDate(history.timestamp)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.isUser
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {message.podcasts && message.podcasts.length > 0 && (
                <div className="mt-4 space-y-4">
                  {message.podcasts.map((podcast) => (
                    <div
                      key={podcast.id}
                      className="bg-white rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={podcast.imageUrl}
                          alt={podcast.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {podcast.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Hosted by {podcast.host}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm text-gray-600">
                              {podcast.rating}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-600 capitalize">
                              {podcast.category}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {podcast.description}
                          </p>
                          <a
                            href={podcast.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            <Headphones className="w-4 h-4" />
                            <span>Listen on {podcast.platform}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 text-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;