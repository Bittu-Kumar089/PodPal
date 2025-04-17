// Google CSE types
declare global {
  interface Window {
    __gcse: {
      elements: {
        render: (element: string, options: { gname?: string }) => void;
        getElement: (element: string) => any;
      };
    };
  }
}

export interface Product {
  title: string;
  link: string;
  price?: string;
  platform: string;
  image?: string;
  description?: string;
  sustainability?: string[];
  merchant?: string;
}

export interface ChatResponse {
  text: string;
  products?: Product[];
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  podcasts?: Podcast[];
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export interface MessageBubbleProps {
  message: Message;
}

export interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onLoadHistory?: (historyId: string) => void;
}

export interface Podcast {
  id: string;
  title: string;
  host: string;
  category: string;
  description: string;
  rating: number;
  imageUrl: string;
  episodeCount?: number;
  averageDuration?: number;
  releaseDate?: Date;
  platform?: string;
  url?: string;
}
