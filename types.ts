// Fix: Import ComponentType to resolve React namespace error.
import type { ComponentType } from 'react';

export type FaqStatus = 'Published' | 'Draft' | 'Review';

export interface Category {
  id: string;
  name: string;
  // Fix: Use ComponentType directly.
  icon: ComponentType<{ className?: string }>;
}

export const INDIAN_LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam'
] as const;

export type Language = typeof INDIAN_LANGUAGES[number];

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string; // Category ID
  languages: Language[];
  status: FaqStatus;
  last_updated: string;
  editor: string;
}

// Fix: Add missing Message type used in Chat.tsx
export type Message = {
  sender: 'user' | 'bot';
  text: string;
};

// Fix: Add missing LogEntry type used in LogViewer.tsx.
export type LogEntry = Record<string, any>;

// Add User type for authentication
export type User = {
  name: string;
  avatarUrl?: string;
};

// Add TranslationRecord type for document translation history
export type TranslationRecord = {
  id: string;
  timestamp: string;
  originalText?: string;       // For text translations
  originalFileName?: string; // For file translations
  translatedText: string;
  instructions: string;
};
