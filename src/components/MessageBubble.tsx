import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Function to safely render HTML content
  const renderHTML = (html: string) => {
    return {
      __html: html
    };
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          message.isUser
            ? 'bg-emerald-100 text-emerald-900'
            : 'bg-white text-gray-800 shadow-sm'
        }`}
      >
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={renderHTML(message.content)}
        />
      </div>
    </div>
  );
};

export default MessageBubble;