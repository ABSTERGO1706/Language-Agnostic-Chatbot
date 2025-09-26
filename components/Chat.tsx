
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessageToChat, initializeChat } from '../services/geminiService';
import type { Message, Faq, Language } from '../types';
import { UserIcon, BotIcon, SendIcon, MicrophoneIcon, UploadIcon } from './Icons';
import type { Chat as GeminiChat, Content } from '@google/genai';

interface ChatProps {
  messages: Message[];
  onMessagesChange: (newMessages: Message[]) => void;
  faqs: Faq[];
  setView: (view: 'chat' | 'documents') => void;
  selectedLanguage: Language | 'auto';
}

export const initialMessage: Message = { sender: 'bot', text: 'Hello! How can I assist you with campus information today?' };

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
}

const quickActions = [
  { label: 'Admission Info', prompt: 'What are the application deadlines for undergraduate programs?' },
  { label: 'Fee Structure', prompt: 'What is the fee structure for the B.Tech program?' },
  { label: 'Library Services', prompt: 'What are the library opening hours?' },
  { label: 'Hostel Info', prompt: 'How can I apply for hostel accommodation?' },
  { label: 'Transport', prompt: 'What are the university transport options?' },
  { label: 'Events', prompt: 'When is the annual tech fest, "Innovate 2024"?' },
];

export const Chat: React.FC<ChatProps> = ({ messages, onMessagesChange, faqs, setView, selectedLanguage }) => {
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [chat, setChat] = useState<GeminiChat | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = async () => {
        if (faqs.length > 0) {
            setIsLoading(true);
            const history: Content[] = messages
                .slice(1) 
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));
            try {
                const newChat = await initializeChat(faqs, history, selectedLanguage);
                setChat(newChat);
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                onMessagesChange([...messages, { sender: 'bot', text: 'Error: Could not initialize the chat session.'}]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs, selectedLanguage]); // Only re-init if faqs or language changes. History is passed on send.

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (speechError) {
        const timer = setTimeout(() => {
            setSpeechError(null);
        }, 5000); // Clear error after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [speechError]);

  const handleSend = useCallback(async (messageText: string = input) => {
    if (messageText.trim() === '' || isLoading || !chat) return;
    
    const userMessage: Message = { sender: 'user', text: messageText };
    const newMessages = [...messages, userMessage];
    onMessagesChange(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const responseJsonString = await sendMessageToChat(chat, messageText);
      let parsedResponse: { detected_language: string; intent: string; response: string };
      try {
        parsedResponse = JSON.parse(responseJsonString);
      } catch (e) {
        console.error("Failed to parse JSON response:", responseJsonString);
        parsedResponse = {
            detected_language: 'unknown',
            intent: 'error',
            response: "Sorry, I encountered an issue processing the response. Please try again."
        }
      }

      const botMessage: Message = { sender: 'bot', text: parsedResponse.response };
      onMessagesChange([...newMessages, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { sender: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      onMessagesChange([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chat, messages, onMessagesChange]);

  const handleMicClick = async () => {
    if (!recognition) {
        setSpeechError("Speech recognition is not supported by your browser.");
        return;
    }

    if (isListening) {
        recognition.stop();
        setIsListening(false); // Manually set state as onend might not fire immediately
        return;
    }
    
    setSpeechError(null);

    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
            setSpeechError("Microphone access is blocked. Please go to your browser settings (often via the lock icon in the address bar) to allow microphone access for this site.");
            return;
        }

        const langCodeMap: Record<Language, string> = {
            'English': 'en-IN',
            'Hindi': 'hi-IN',
            'Tamil': 'ta-IN',
            'Telugu': 'te-IN',
            'Malayalam': 'ml-IN',
        };

        if (selectedLanguage !== 'auto') {
            recognition.lang = langCodeMap[selectedLanguage];
        } else {
            recognition.lang = navigator.language || 'en-IN';
        }
        
        recognition.start();

        recognition.onstart = () => {
            setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
            setInput(event.results[0][0].transcript);
        };
        
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            let errorMessage = `An unknown speech recognition error occurred (${event.error}). Please try again.`;

            switch (event.error) {
                case 'no-speech':
                    errorMessage = "No speech detected. Please try speaking again.";
                    break;
                case 'audio-capture':
                    errorMessage = "Audio capture failed. Please check if your microphone is connected and not used by another application.";
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                    errorMessage = "Microphone access was denied. Please allow permissions to use this feature.";
                    break;
                 case 'network':
                     errorMessage = "A network error occurred during speech recognition. Please check your connection.";
                     break;
            }
            setSpeechError(errorMessage);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

    } catch (err) {
        console.error("Error checking microphone permissions:", err);
        setSpeechError("Could not check microphone permissions. Please ensure your browser is up to date and supports the Permissions API.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-[calc(100vh-165px)]">
      {messages.length <= 1 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Campus Assistant</h2>
            <p className="max-w-md text-slate-600 mb-6">Got questions? Ask here! I’ll guide you through campus services in the language you speak.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8">
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => handleSend(action.prompt)}
                        className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition-colors"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
                 {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-md p-3 rounded-lg bg-slate-200 text-slate-800 rounded-bl-none">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      <div className="p-4 border-t border-slate-200">
          {speechError && <p className="text-xs text-red-600 mb-2 text-center">{speechError}</p>}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
              <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={isListening ? "Listening..." : (isLoading ? "Assistant is thinking..." : "Type your message...")}
                  className="w-full px-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={1}
                  disabled={isLoading || isListening}
                  aria-label="Chat input"
              />
               <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={`p-2 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                  <MicrophoneIcon className="w-5 h-5" />
              </button>
              <button
                  type="submit"
                  disabled={input.trim() === '' || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Send message"
              >
                  <SendIcon className="w-5 h-5" />
              </button>
          </form>
      </div>
    </div>
  );
};
