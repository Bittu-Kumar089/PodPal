import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      await onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-grow the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 relative">
      <div className="relative flex items-end">
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about podcasts..."
          className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[52px] max-h-[150px]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`absolute right-3 bottom-3 p-1 rounded-full ${
            message.trim() && !isLoading
              ? 'text-indigo-600 hover:bg-indigo-50'
              : 'text-gray-400'
          }`}
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-2 flex gap-2 text-xs text-gray-500">
        <button
          type="button"
          className="flex items-center gap-1 p-1 hover:bg-indigo-50 rounded"
        >
          <Mic className="w-3 h-3" />
          <span>Voice search</span>
        </button>
        <span>•</span>
        <span>
          Ask for podcast recommendations, genres, or discover what's trending
        </span>
      </div>
    </form>
  );
};

export default ChatInput;