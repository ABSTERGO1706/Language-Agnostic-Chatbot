// Fix: Import useState and other React hooks to resolve reference errors.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Faq, Category, FaqStatus, Language, Message, User, TranslationRecord } from './types';
import { INDIAN_LANGUAGES } from './types';
import { 
    LayoutDashboardIcon, BookOpenIcon, BriefcaseIcon, ShieldIcon, BuildingIcon, CalendarIcon, PlusCircleIcon, SearchIcon, MoreHorizontalIcon,
    CheckCircleIcon, AlertCircleIcon, ClockIcon, XIcon, PlusIcon, FileTextIcon, BotIcon, MessageSquarePlusIcon, ChevronLeftIcon,
    GoogleIcon, FacebookIcon, UserCircleIcon, LogOutIcon, SpinnerIcon, EditIcon, TrashIcon, MenuIcon
} from './components/Icons';
import { Chat } from './components/Chat';
import { DocumentTranslator } from './components/DocumentTranslator';
import { initialMessage } from './components/Chat';

// --- MOCK DATA (Shared across both interfaces) ---
const CATEGORIES: Category[] = [
    { id: 'admissions', name: 'Admissions', icon: BookOpenIcon },
    { id: 'academics', name: 'Academics', icon: BriefcaseIcon },
    { id: 'campus-services', name: 'Campus Services', icon: BuildingIcon },
    { id: 'policies', name: 'Policies', icon: ShieldIcon },
    { id: 'events', name: 'Events', icon: CalendarIcon },
];

const MOCK_FAQS: Faq[] = [
  {
    id: 'faq-1',
    question: 'What are the application deadlines for undergraduate programs?',
    answer: 'The application deadline for the Fall semester is June 30th. For the Spring semester, it is November 30th.',
    category: 'admissions',
    languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
    status: 'Published',
    last_updated: '2024-07-28T10:00:00Z',
    editor: 'Alice Johnson'
  },
  {
    id: 'faq-2',
    question: 'How can I check my semester results?',
    answer: 'Semester results are published on the student portal under the "Examinations" section. You will need your student ID to log in.',
    category: 'academics',
    languages: ['English', 'Hindi', 'Malayalam'],
    status: 'Published',
    last_updated: '2024-07-27T15:30:00Z',
    editor: 'Bob Williams'
  },
  {
    id: 'faq-3',
    question: 'What are the library opening hours?',
    answer: 'The main library is open from 8 AM to 11 PM on weekdays and 10 AM to 8 PM on weekends.',
    category: 'campus-services',
    languages: ['English', 'Hindi'],
    status: 'Published',
    last_updated: '2024-07-29T09:15:00Z',
    editor: 'Charlie Brown'
  },
   {
    id: 'faq-4',
    question: 'What is the university\'s attendance policy?',
    answer: 'A minimum of 75% attendance is required in all courses to be eligible for the final examinations. Medical leave must be substantiated with a doctor\'s certificate.',
    category: 'policies',
    languages: ['English', 'Hindi'],
    status: 'Review',
    last_updated: '2024-07-26T11:00:00Z',
    editor: 'Diana Prince'
  },
  {
    id: 'faq-5',
    question: 'When is the annual tech fest, "Innovate 2024"?',
    answer: 'The dates for Innovate 2024 are yet to be finalized. Please check the official events page for updates.',
    category: 'events',
    languages: ['English'],
    status: 'Published',
    last_updated: '2024-07-29T12:00:00Z',
    editor: 'Eve Adams'
  },
  {
    id: 'faq-6',
    question: 'What is the fee structure for the B.Tech program?',
    answer: 'The tuition fee for the B.Tech program is ₹1,50,000 per semester. Additional fees for examination, library, and labs amount to ₹15,000 per semester. The detailed fee structure is available on the university website.',
    category: 'admissions',
    languages: ['English', 'Hindi'],
    status: 'Published',
    last_updated: '2024-07-30T11:00:00Z',
    editor: 'Grace Hopper'
  },
  {
    id: 'faq-7',
    question: 'How can I apply for hostel accommodation?',
    answer: 'Hostel applications are available on the student portal under the "Accommodation" tab. The deadline for application is July 15th. Rooms are allocated on a first-come, first-served basis.',
    category: 'campus-services',
    languages: ['English', 'Hindi', 'Tamil'],
    status: 'Published',
    last_updated: '2024-07-30T12:00:00Z',
    editor: 'Grace Hopper'
  },
  {
    id: 'faq-8',
    question: 'What are the university transport options?',
    answer: 'The university provides bus services from various points in the city. The bus routes and schedules are available on the university website. A transport fee of ₹10,000 per semester is applicable.',
    category: 'campus-services',
    languages: ['English', 'Hindi'],
    status: 'Published',
    last_updated: '2024-07-30T13:00:00Z',
    editor: 'Grace Hopper'
  }
];

export type ChatSession = {
    id: string;
    title: string;
    timestamp: string;
    messages: Message[];
};

// For re-hydrating category icons after loading from localStorage
const iconMapById: { [key: string]: React.ComponentType<{className?:string}> } = {
    'admissions': BookOpenIcon,
    'academics': BriefcaseIcon,
    'campus-services': BuildingIcon,
    'policies': ShieldIcon,
    'events': CalendarIcon,
};


// ===================================================================================
// MOCK AUTHENTICATION SERVICE
// ===================================================================================

const mockLoginWithProvider = (provider: 'google' | 'facebook'): Promise<User> => {
    console.log(`Simulating login with ${provider}...`);
    return new Promise(resolve => {
        setTimeout(() => {
            const user: User = { name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User` };
            console.log(`Simulated login success for ${user.name}`);
            resolve(user);
        }, 1500);
    });
};

const mockSendOtp = (mobile: string): Promise<string> => {
    console.log(`Simulating sending OTP to ${mobile}...`);
    return new Promise(resolve => {
        setTimeout(() => {
            const otp = "123456"; // Hardcoded for simulation
            console.log(`%cMock OTP Generated: ${otp}`, 'color: blue; font-weight: bold; font-size: 14px;');
            alert(`[SIMULATION] OTP sent to ${mobile}: ${otp}`);
            resolve(otp);
        }, 1000);
    });
};

const mockVerifyOtp = (mobile: string, otp: string): Promise<User | null> => {
    console.log(`Simulating OTP verification for ${mobile} with OTP ${otp}...`);
    return new Promise(resolve => {
        setTimeout(() => {
            if (otp === "123456") {
                const user: User = { name: `User (+${mobile.slice(0, 5)}...` };
                console.log("OTP Verification successful.");
                resolve(user);
            } else {
                console.error("OTP Verification failed.");
                resolve(null);
            }
        }, 1000);
    });
};

// ===================================================================================
// INTERFACE 0: LOGIN VIEW
// ===================================================================================

const LoginView: React.FC<{ onLoginSuccess: (user: User) => void; }> = ({ onLoginSuccess }) => {
    const [step, setStep] = useState<'initial' | 'otp'>('initial');
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'mobile' | null>(null);

    const handleProviderLogin = async (provider: 'google' | 'facebook') => {
        setError(null);
        setLoadingProvider(provider);
        try {
            const user = await mockLoginWithProvider(provider);
            onLoginSuccess(user);
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoadingProvider(null);
        }
    };
    
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{10,15}$/.test(mobileNumber)) {
            setError('Please enter a valid mobile number.');
            return;
        }
        setError(null);
        setLoadingProvider('mobile');
        try {
            await mockSendOtp(mobileNumber);
            setStep('otp');
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoadingProvider(null);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP.');
            return;
        }
        setError(null);
        setLoadingProvider('mobile');
        try {
            const user = await mockVerifyOtp(mobileNumber, otp);
            if (user) {
                onLoginSuccess(user);
            } else {
                setError('Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('An error occurred during verification.');
        } finally {
            setLoadingProvider(null);
        }
    };

    return (
        <div className="flex items-center justify-center h-full -mt-10">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
                    <p className="text-slate-500">Log in to your account</p>
                </div>

                {error && <p className="p-3 text-sm text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
                
                {step === 'initial' ? (
                    <div className="space-y-4">
                        <button onClick={() => handleProviderLogin('google')} disabled={!!loadingProvider} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                           {loadingProvider === 'google' ? <SpinnerIcon className="w-5 h-5" /> : <GoogleIcon className="w-5 h-5" />} <span className="font-semibold text-slate-700">Continue with Google</span>
                        </button>
                        <button onClick={() => handleProviderLogin('facebook')} disabled={!!loadingProvider} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                           {loadingProvider === 'facebook' ? <SpinnerIcon className="w-5 h-5" /> : <FacebookIcon className="w-5 h-5" />} <span className="font-semibold text-slate-700">Continue with Facebook</span>
                        </button>

                        <div className="flex items-center text-xs text-slate-400"><div className="flex-1 border-t border-slate-200"></div><span className="px-2">OR</span><div className="flex-1 border-t border-slate-200"></div></div>

                        <form onSubmit={handleSendOtp} className="space-y-4">
                             <div>
                                <label htmlFor="mobile" className="sr-only">Mobile Number</label>
                                <input type="tel" id="mobile" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="Enter Mobile Number" required className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                             </div>
                             <button type="submit" disabled={!!loadingProvider} className="w-full py-3 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center justify-center">
                                {loadingProvider === 'mobile' ? <><SpinnerIcon className="w-5 h-5 mr-2" /> Sending...</> : 'Send OTP'}
                             </button>
                        </form>
                    </div>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <p className="text-sm text-center text-slate-600">Enter the 6-digit OTP sent to <br/><span className="font-semibold">{mobileNumber}</span></p>
                         <div>
                            <label htmlFor="otp" className="sr-only">OTP</label>
                            <input type="text" id="otp" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" required maxLength={6} className="w-full text-center tracking-[0.5em] px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                         </div>
                         <button type="submit" disabled={!!loadingProvider} className="w-full py-3 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center justify-center">
                             {loadingProvider === 'mobile' ? <><SpinnerIcon className="w-5 h-5 mr-2" /> Verifying...</> : 'Verify & Login'}
                         </button>
                         <button type="button" onClick={() => setStep('initial')} className="w-full text-sm text-center text-slate-600 hover:text-blue-600">Back</button>
                    </form>
                )}
            </div>
        </div>
    );
};


// ===================================================================================
// INTERFACE 1: CHAT ASSISTANT
// ===================================================================================

const ChatHistorySidebar: React.FC<{
    histories: ChatSession[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ histories, activeId, onSelect, onNew, isExpanded, onToggle }) => {
    
    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString();
    };

    return (
        <aside className="bg-slate-50 rounded-xl shadow-lg flex flex-col h-full">
             <div className="p-3 border-b border-slate-200">
                <button 
                    onClick={onNew} 
                    className={`w-full flex items-center justify-center gap-2 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors ${isExpanded ? 'px-3 py-2' : 'p-3'}`}
                    title="New Chat"
                >
                    <MessageSquarePlusIcon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && <span className="truncate">New Chat</span>}
                </button>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {histories.map(session => (
                    <button 
                        key={session.id}
                        onClick={() => onSelect(session.id)}
                        className={`w-full text-left rounded-lg transition-colors flex items-center ${isExpanded ? 'p-3 gap-3' : 'p-2 justify-center'} ${session.id === activeId ? 'bg-blue-100' : 'hover:bg-slate-200'}`}
                        title={session.title}
                    >
                       {isExpanded ? (
                            <div className={`flex-1 overflow-hidden ${session.id === activeId ? 'text-blue-800' : 'text-slate-700'}`}>
                                <p className="font-semibold text-sm truncate">{session.title}</p>
                                <p className={`text-xs ${session.id === activeId ? 'text-blue-600' : 'text-slate-500'}`}>{formatDate(session.timestamp)}</p>
                            </div>
                        ) : (
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${session.id === activeId ? 'bg-blue-200' : 'bg-slate-300'}`}>
                                <span className={`text-sm font-bold ${session.id === activeId ? 'text-blue-800' : 'text-slate-600'}`}>{session.title.charAt(0).toUpperCase()}</span>
                             </div>
                        )}
                    </button>
                ))}
            </nav>
            <div className="p-2 border-t border-slate-200">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center gap-2 p-2 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                    title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                    aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                    aria-expanded={isExpanded}
                >
                    <ChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${!isExpanded && 'rotate-180'}`} />
                </button>
            </div>
        </aside>
    );
};


const ChatInterfaceView: React.FC<{
    faqs: Faq[];
    chatHistories: ChatSession[];
    activeChatId: string | null;
    onUpdateHistory: (updatedSession: ChatSession) => void;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    translationHistory: TranslationRecord[];
    onTranslationHistoryChange: (history: TranslationRecord[]) => void;
}> = ({ faqs, chatHistories, activeChatId, onUpdateHistory, onNewChat, onSelectChat, translationHistory, onTranslationHistoryChange }) => {
    const [view, setView] = useState<'chat' | 'documents'>('chat');
    const [selectedLanguage, setSelectedLanguage] = useState<Language | 'auto'>('auto');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarExpanded(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const activeChat = chatHistories.find(c => c.id === activeChatId);

    const handleMessagesChange = (newMessages: Message[]) => {
        if (!activeChat) return;

        const firstUserMessage = newMessages.find(m => m.sender === 'user');
        const newTitle = firstUserMessage ? firstUserMessage.text : "New Chat";
        
        const updatedSession: ChatSession = {
            ...activeChat,
            messages: newMessages,
            title: activeChat.title === "New Chat" && newTitle !== "New Chat" ? newTitle : activeChat.title,
            timestamp: new Date().toISOString(),
        };
        onUpdateHistory(updatedSession);
    };

    return (
        <div className="flex gap-0 md:gap-6">
            {/* Mobile Sidebar Overlay */}
            <div className={`md:hidden fixed inset-0 z-40 flex transition-transform duration-300 ${isSidebarExpanded ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-72 h-full">
                     <ChatHistorySidebar 
                        histories={chatHistories}
                        activeId={activeChatId}
                        onSelect={(id) => { onSelectChat(id); setIsSidebarExpanded(false); }}
                        onNew={() => { onNewChat(); setIsSidebarExpanded(false); }}
                        isExpanded={true}
                        onToggle={() => setIsSidebarExpanded(false)}
                    />
                </div>
                <div className="flex-1 bg-black/50" onClick={() => setIsSidebarExpanded(false)}></div>
            </div>

            {/* Desktop Sidebar */}
            <div className={`hidden md:block transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-72' : 'w-20'}`}>
                <ChatHistorySidebar 
                    histories={chatHistories}
                    activeId={activeChatId}
                    onSelect={onSelectChat}
                    onNew={onNewChat}
                    isExpanded={isSidebarExpanded}
                    onToggle={() => setIsSidebarExpanded(p => !p)}
                />
            </div>
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <header className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-1 -ml-1 text-slate-600" onClick={() => setIsSidebarExpanded(true)} aria-label="Open chat history">
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                        <div className="relative">
                            <BotIcon className="w-10 h-10 text-blue-500" />
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" title="Online"></span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Campus Assistant</h1>
                            <p className="text-sm text-slate-500">Multilingual Support</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select 
                            className="px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            aria-label="Select interface language"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as Language | 'auto')}
                        >
                            <option value="auto">Auto-detect Language</option>
                            {INDIAN_LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <button onClick={() => setView('documents')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'documents' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                            <FileTextIcon className="w-4 h-4" />
                            Documents
                        </button>
                    </div>
                </header>

                <div>
                    {view === 'chat' && activeChat ? 
                        <Chat 
                            faqs={faqs} 
                            messages={activeChat.messages}
                            onMessagesChange={handleMessagesChange}
                            setView={setView} 
                            selectedLanguage={selectedLanguage}
                            key={activeChatId} // Force re-mount on chat change
                        /> :
                        <DocumentTranslator 
                            setView={setView} 
                            history={translationHistory}
                            onHistoryChange={onTranslationHistoryChange}
                        />
                    }
                </div>
            </div>
        </div>
    );
};


// ===================================================================================
// INTERFACE 2: FAQ MANAGEMENT DASHBOARD
// ===================================================================================
const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        firstElement?.focus();
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" aria-modal="true" role="dialog" aria-labelledby="confirmation-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-0 text-left">
                            <h3 className="text-lg leading-6 font-medium text-slate-900" id="confirmation-modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-500">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="button" onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                </div>
            </div>
        </div>
    );
};


const LanguageProgressModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    faq: Faq | null;
    onSave: (languages: Language[]) => void;
}> = ({ isOpen, onClose, faq, onSave }) => {
    const [selectedLanguages, setSelectedLanguages] = useState<Set<Language>>(new Set());
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (faq) {
            setSelectedLanguages(new Set(faq.languages));
        }
    }, [faq]);
    
    useEffect(() => {
        if (!isOpen) return;
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { 
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        closeButtonRef.current?.focus();
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    if (!isOpen || !faq) return null;

    const handleCheckboxChange = (language: Language, checked: boolean) => {
        const newSet = new Set(selectedLanguages);
        if (checked) {
            newSet.add(language);
        } else {
            newSet.delete(language);
        }
        setSelectedLanguages(newSet);
    };
    
    const handleSave = () => {
        onSave(Array.from(selectedLanguages).sort((a: Language, b: Language) => (INDIAN_LANGUAGES as readonly string[]).indexOf(a) - (INDIAN_LANGUAGES as readonly string[]).indexOf(b)));
    };

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog" aria-labelledby="lang-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 id="lang-modal-title" className="text-xl font-semibold text-slate-800">Manage Languages</h2>
                    <p className="text-sm text-slate-500 truncate">For: "{faq.question}"</p>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-slate-600">Select the languages for which this FAQ has been translated and verified. ({selectedLanguages.size} / {INDIAN_LANGUAGES.length} selected)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {INDIAN_LANGUAGES.map(lang => (
                            <label key={lang} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedLanguages.has(lang)}
                                    onChange={(e) => handleCheckboxChange(lang, e.target.checked)}
                                    className="rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{lang}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button ref={closeButtonRef} type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const AddCategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddCategory: (category: Category) => void;
}> = ({ isOpen, onClose, onAddCategory }) => {
    const [name, setName] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { 
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        firstElement?.focus();
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddCategory({
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name: name.trim(),
                icon: BookOpenIcon, // Default icon
            });
            setName('');
            onClose();
        }
    };

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog" aria-labelledby="add-category-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h2 id="add-category-modal-title" className="text-xl font-semibold text-slate-800">Add New Category</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6">
                        <label htmlFor="category-name" className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                        <input
                            type="text"
                            id="category-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="e.g. Student Life"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Category</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Sidebar: React.FC<{ 
    categories: Category[], 
    faqs: Faq[],
    selectedCategory: string | null,
    onSelectCategory: (id: string | null) => void,
    onOpenAddCategoryModal: () => void,
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}> = ({ categories, faqs, selectedCategory, onSelectCategory, onOpenAddCategoryModal, isMobileOpen, onMobileClose }) => {
    const getCategoryCount = (categoryId: string) => faqs.filter(faq => faq.category === categoryId).length;
    
    const sidebarContent = (
        <>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Campus FAQ</h1>
                    <span className="text-sm text-slate-400">Management System</span>
                </div>
                <button onClick={onMobileClose} className="md:hidden p-1 text-slate-400 hover:text-white" aria-label="Close menu">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button 
                    onClick={() => { onSelectCategory(null); onMobileClose?.(); }}
                    className={`flex items-center gap-3 px-3 py-2 w-full text-left rounded-md transition-colors ${!selectedCategory ? 'bg-slate-700 text-white' : 'hover:bg-slate-700'}`}
                >
                    <LayoutDashboardIcon className="w-5 h-5" />
                    <span>Dashboard</span>
                </button>
                <h3 className="px-3 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</h3>
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => { onSelectCategory(cat.id); onMobileClose?.(); }}
                        className={`flex items-center justify-between gap-3 px-3 py-2 w-full text-left rounded-md transition-colors ${selectedCategory === cat.id ? 'bg-slate-700 text-white' : 'hover:bg-slate-700'}`}
                    >
                        <div className="flex items-center gap-3">
                            <cat.icon className="w-5 h-5 text-slate-400" />
                            <span>{cat.name}</span>
                        </div>
                        <span className="text-xs font-mono bg-slate-600 text-slate-200 px-1.5 py-0.5 rounded-full">{getCategoryCount(cat.id)}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
                <button onClick={() => { onOpenAddCategoryModal(); onMobileClose?.(); }} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Add Category</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-slate-800 text-slate-300 flex-col h-screen sticky top-0 hidden md:flex">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            {isMobileOpen && (
                 <div className="md:hidden fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
                    <div className={`w-72 bg-slate-800 text-slate-300 flex flex-col h-full transition-transform transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        {sidebarContent}
                    </div>
                    <div className="flex-1 bg-black bg-opacity-50" onClick={onMobileClose}></div>
                </div>
            )}
        </>
    );
};

const DashboardHeader: React.FC<{ onOpenModal: () => void; onOpenMobileMenu: () => void; }> = ({ onOpenModal, onOpenMobileMenu }) => (
    <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10 gap-4">
        <button className="md:hidden p-2 -ml-2 text-slate-600" onClick={onOpenMobileMenu} aria-label="Open sidebar menu">
            <MenuIcon className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-xs sm:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search FAQs..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
        </div>
        <button onClick={onOpenModal} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0">
            <PlusIcon className="w-5 h-5" /> <span className="hidden sm:inline">Create FAQ</span>
        </button>
    </header>
);

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ComponentType<{className?:string}>, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-6 h-6" /></div>
    </div>
);

const SummaryCards: React.FC<{ faqs: Faq[] }> = ({ faqs }) => {
    const published = faqs.filter(f => f.status === 'Published').length;
    const drafts = faqs.filter(f => f.status === 'Draft').length;
    const inReview = faqs.filter(f => f.status === 'Review').length;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard title="Total FAQs" value={faqs.length} icon={BookOpenIcon} color="bg-blue-100 text-blue-600" />
            <SummaryCard title="Published" value={published} icon={CheckCircleIcon} color="bg-green-100 text-green-600" />
            <SummaryCard title="In Review" value={inReview} icon={ClockIcon} color="bg-yellow-100 text-yellow-600" />
            <SummaryCard title="Drafts" value={drafts} icon={AlertCircleIcon} color="bg-orange-100 text-orange-600" />
        </div>
    );
};

const FaqTable: React.FC<{ 
    faqs: Faq[], 
    onOpenLangModal: (faq: Faq) => void, 
    categories: Category[],
    onEdit: (faq: Faq) => void,
    onDelete: (id: string) => void,
}> = ({ faqs, onOpenLangModal, categories, onEdit, onDelete }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                    <tr>
                        <th className="p-4 w-4"><input type="checkbox" className="rounded border-slate-300" /></th>
                        <th className="p-4">Question</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Language Progress</th>
                        <th className="p-4">Last Updated</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                    </tr>
                </thead>
                <tbody>{faqs.map(faq => <FaqTableRow key={faq.id} faq={faq} onOpenLangModal={onOpenLangModal} categories={categories} onEdit={onEdit} onDelete={onDelete} />)}</tbody>
            </table>
        </div>
    </div>
);

const FaqTableRow: React.FC<{ 
    faq: Faq, 
    onOpenLangModal: (faq: Faq) => void, 
    categories: Category[],
    onEdit: (faq: Faq) => void,
    onDelete: (id: string) => void,
}> = ({ faq, onOpenLangModal, categories, onEdit, onDelete }) => {
    const category = categories.find(c => c.id === faq.category);
    const progress = Math.round((faq.languages.length / INDIAN_LANGUAGES.length) * 100);
    const lastUpdated = new Date(faq.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    return (
        <tr className="bg-white hover:bg-slate-50 border-b border-slate-200">
            <td className="p-4 w-4"><input type="checkbox" className="rounded border-slate-300" /></td>
            <td className="p-4">
                <p className="font-medium text-slate-800 truncate max-w-xs">{faq.question}</p>
                <p className="text-xs text-slate-500">by {faq.editor}</p>
            </td>
            <td className="p-4"><span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">{category?.name}</span></td>
            <td className="p-4">
                <button 
                    onClick={() => onOpenLangModal(faq)} 
                    className="w-full text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 -m-1"
                    aria-label={`Manage languages for ${faq.question}`}
                 >
                    <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{faq.languages.length}/{INDIAN_LANGUAGES.length}</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                        <div className="bg-blue-500 h-1.5 rounded-full group-hover:bg-blue-700 transition-colors" style={{ width: `${progress}%` }}></div>
                    </div>
                </button>
            </td>
            <td className="p-4 text-sm text-slate-600">{lastUpdated}</td>
            <td className="p-4"><StatusPill status={faq.status} /></td>
            <td className="p-4 text-center">
                <div className="relative inline-block text-left" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                        <MoreHorizontalIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                    onClick={() => { onEdit(faq); setIsMenuOpen(false); }}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    role="menuitem"
                                >
                                    <EditIcon className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => { onDelete(faq.id); setIsMenuOpen(false); }}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    role="menuitem"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const StatusPill: React.FC<{ status: FaqStatus }> = ({ status }) => {
    const styles = { Published: "bg-green-100 text-green-800", Draft: "bg-orange-100 text-orange-800", Review: "bg-yellow-100 text-yellow-800" };
    const dotStyles = { Published: "bg-green-500", Draft: "bg-orange-500", Review: "bg-yellow-500" };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${styles[status]}`}>
            <span className={`w-2 h-2 rounded-full ${dotStyles[status]}`}></span>{status}
        </span>
    );
};

const FaqModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onAddFaq: (faq: Omit<Faq, 'id' | 'languages' | 'last_updated' | 'editor'>) => void;
    onEditFaq: (faq: Faq) => void;
    faqToEdit: Faq | null;
    categories: Category[];
}> = ({ isOpen, onClose, onAddFaq, onEditFaq, faqToEdit, categories }) => {
    const isEditMode = !!faqToEdit;
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [category, setCategory] = useState(categories[0]?.id || '');
    const [status, setStatus] = useState<FaqStatus>('Draft');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setQuestion(faqToEdit.question);
                setAnswer(faqToEdit.answer);
                setCategory(faqToEdit.category);
                setStatus(faqToEdit.status);
            } else {
                setQuestion('');
                setAnswer('');
                setCategory(categories[0]?.id || '');
                setStatus('Draft');
            }
        }
    }, [isOpen, isEditMode, faqToEdit, categories]);
    
    useEffect(() => {
        if (!isOpen) return;
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { 
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        firstElement?.focus();
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode) {
            onEditFaq({ ...faqToEdit, question, answer, category, status, last_updated: new Date().toISOString(), editor: 'Current User' });
        } else {
            onAddFaq({ question, answer, category, status });
        }
    };

    if (!isOpen) return null;
    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog" aria-labelledby="faq-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center"><h2 id="faq-modal-title" className="text-xl font-semibold text-slate-800">{isEditMode ? 'Edit FAQ' : 'Create New FAQ'}</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon className="w-6 h-6 text-slate-500" /></button></div>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div><label htmlFor="question" className="block text-sm font-medium text-slate-700 mb-1">Question</label><input type="text" id="question" value={question} onChange={e => setQuestion(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div><label htmlFor="answer" className="block text-sm font-medium text-slate-700 mb-1">Answer</label><textarea id="answer" value={answer} onChange={e => setAnswer(e.target.value)} required rows={5} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"></textarea></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Category</label><select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
                            <div><label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label><select id="status" value={status} onChange={e => setStatus(e.target.value as FaqStatus)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="Draft">Draft</option><option value="Review">Review</option><option value="Published">Published</option></select></div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{isEditMode ? 'Save Changes' : 'Create FAQ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FaqCard: React.FC<{ 
    faq: Faq, 
    onOpenLangModal: (faq: Faq) => void, 
    categories: Category[],
    onEdit: (faq: Faq) => void,
    onDelete: (id: string) => void,
}> = ({ faq, onOpenLangModal, categories, onEdit, onDelete }) => {
    const category = categories.find(c => c.id === faq.category);
    const progress = Math.round((faq.languages.length / INDIAN_LANGUAGES.length) * 100);
    const lastUpdated = new Date(faq.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3">
            <div>
                <p className="font-semibold text-slate-800">{faq.question}</p>
                <p className="text-xs text-slate-500 mt-1">Last updated by {faq.editor} on {lastUpdated}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
                <StatusPill status={faq.status} />
                <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">{category?.name}</span>
            </div>

            <button 
                onClick={() => onOpenLangModal(faq)} 
                className="w-full text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 -m-1"
                aria-label={`Manage languages for ${faq.question}`}
            >
                <p className="text-xs font-medium text-slate-700 group-hover:text-blue-600">{faq.languages.length}/{INDIAN_LANGUAGES.length} Languages</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div className="bg-blue-500 h-1.5 rounded-full group-hover:bg-blue-700 transition-colors" style={{ width: `${progress}%` }}></div>
                </div>
            </button>

            <div className="border-t border-slate-200 pt-2 flex items-center justify-end gap-2">
                <button
                    onClick={() => onEdit(faq)}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
                >
                    <EditIcon className="w-4 h-4" /> Edit
                </button>
                <button
                    onClick={() => onDelete(faq.id)}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                    <TrashIcon className="w-4 h-4" /> Delete
                </button>
            </div>
        </div>
    );
};

const FaqCardList: React.FC<{ 
    faqs: Faq[], 
    onOpenLangModal: (faq: Faq) => void, 
    categories: Category[],
    onEdit: (faq: Faq) => void,
    onDelete: (id: string) => void,
}> = ({ faqs, onOpenLangModal, categories, onEdit, onDelete }) => (
    <div className="space-y-4">
        {faqs.map(faq => (
            <FaqCard 
                key={faq.id} 
                faq={faq} 
                onOpenLangModal={onOpenLangModal} 
                categories={categories} 
                onEdit={onEdit} 
                onDelete={onDelete}
            />
        ))}
    </div>
);


const DashboardView: React.FC<{
    faqs: Faq[];
    setFaqs: React.Dispatch<React.SetStateAction<Faq[]>>;
    categories: Category[];
    onAddCategory: (category: Category) => void;
}> = ({ faqs, setFaqs, categories, onAddCategory }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [editingLanguagesFaq, setEditingLanguagesFaq] = useState<Faq | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
    const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const handleOpenCreateModal = () => {
        setEditingFaq(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (faq: Faq) => {
        setEditingFaq(faq);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFaq(null);
    };

    const handleAddFaq = (faqData: Omit<Faq, 'id' | 'languages' | 'last_updated' | 'editor'>) => {
        const newFaq: Faq = {
            ...faqData,
            id: `faq-${Date.now()}`,
            languages: ['English'],
            last_updated: new Date().toISOString(),
            editor: 'Current User',
        };
        setFaqs(prevFaqs => [newFaq, ...prevFaqs]);
        handleCloseModal();
    };

    const handleEditFaq = (updatedFaq: Faq) => {
        setFaqs(prevFaqs => prevFaqs.map(f => (f.id === updatedFaq.id ? updatedFaq : f)));
        handleCloseModal();
    };
    
    const handleDeleteFaq = () => {
        if (!deletingFaqId) return;
        setFaqs(prevFaqs => prevFaqs.filter(f => f.id !== deletingFaqId));
        setDeletingFaqId(null);
    };

    const handleUpdateFaqLanguages = (faqId: string, newLanguages: Language[]) => {
        setFaqs(prevFaqs => 
            prevFaqs.map(f => 
                f.id === faqId 
                ? { ...f, languages: newLanguages, last_updated: new Date().toISOString(), editor: 'Current User' } 
                : f
            )
        );
        setEditingLanguagesFaq(null); // Close modal
    };

    const filteredFaqs = selectedCategory ? faqs.filter(faq => faq.category === selectedCategory) : faqs;

    return (
        <div className="bg-slate-100 flex -m-6 min-h-screen">
            <Sidebar 
                categories={categories} 
                faqs={faqs} 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory}
                onOpenAddCategoryModal={() => setIsAddCategoryModalOpen(true)}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
             />
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader onOpenModal={handleOpenCreateModal} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <SummaryCards faqs={filteredFaqs} />
                    <div className="hidden md:block">
                        <FaqTable 
                            faqs={filteredFaqs} 
                            onOpenLangModal={setEditingLanguagesFaq} 
                            categories={categories} 
                            onEdit={handleOpenEditModal}
                            onDelete={setDeletingFaqId}
                        />
                    </div>
                    <div className="md:hidden">
                        <FaqCardList
                            faqs={filteredFaqs} 
                            onOpenLangModal={setEditingLanguagesFaq} 
                            categories={categories} 
                            onEdit={handleOpenEditModal}
                            onDelete={setDeletingFaqId}
                        />
                    </div>
                </main>
            </div>
            <FaqModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onAddFaq={handleAddFaq}
                onEditFaq={handleEditFaq}
                faqToEdit={editingFaq} 
                categories={categories} 
            />
            <AddCategoryModal 
                isOpen={isAddCategoryModalOpen}
                onClose={() => setIsAddCategoryModalOpen(false)}
                onAddCategory={onAddCategory}
            />
            <LanguageProgressModal 
                isOpen={!!editingLanguagesFaq}
                onClose={() => setEditingLanguagesFaq(null)}
                faq={editingLanguagesFaq}
                onSave={(newLangs) => {
                    if (editingLanguagesFaq) {
                        handleUpdateFaqLanguages(editingLanguagesFaq.id, newLangs);
                    }
                }}
            />
            <ConfirmationModal
                isOpen={!!deletingFaqId}
                onClose={() => setDeletingFaqId(null)}
                onConfirm={handleDeleteFaq}
                title="Delete FAQ"
                message="Are you sure you want to delete this FAQ? This action cannot be undone."
            />
        </div>
    );
};

// ===================================================================================
// MAIN APP COMPONENT (Router)
// ===================================================================================

const getUserStorageKey = (baseKey: string, user: User | null): string | null => {
    if (!user?.name) return null;
    const userIdentifier = user.name.replace(/\s+/g, '_').toLowerCase();
    return `${baseKey}_${userIdentifier}`;
};

const UserMenu: React.FC<{ user: User; onLogout: () => void; }> = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls="user-menu"
            >
                <span className="font-semibold text-slate-700 text-sm hidden sm:inline">{user.name}</span>
                <UserCircleIcon className="w-8 h-8 text-slate-500" />
            </button>
            {isOpen && (
                 <div id="user-menu" className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30" role="menu">
                     <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                        <LogOutIcon className="w-4 h-4" />
                        Logout
                    </button>
                 </div>
            )}
        </div>
    );
};

const AppHeader: React.FC<{
    currentView: 'dashboard' | 'chat' | 'login';
    setView: (view: 'dashboard' | 'chat') => void;
    isAuthenticated: boolean;
    user: User | null;
    onLoginClick: () => void;
    onLogout: () => void;
}> = ({ currentView, setView, isAuthenticated, user, onLoginClick, onLogout }) => {
    const buttonBase = "px-4 py-2 rounded-md font-semibold transition-colors text-sm";
    const activeClass = "bg-blue-600 text-white";
    const inactiveClass = "bg-white text-slate-600 hover:bg-slate-100";
    
    return (
        <header className="bg-white p-4 shadow-md sticky top-0 z-20 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">Lang Agnostic Chatbot</h1>
            <div className="flex items-center gap-4">
                {isAuthenticated && (
                    <div className="hidden md:flex items-center p-1 bg-slate-200 rounded-lg">
                        <button onClick={() => setView('chat')} className={`${buttonBase} ${currentView === 'chat' ? activeClass : inactiveClass}`}>
                            Chat Assistant
                        </button>
                        <button onClick={() => setView('dashboard')} className={`${buttonBase} ${currentView === 'dashboard' ? activeClass : inactiveClass}`}>
                            FAQ Dashboard
                        </button>
                    </div>
                )}
                {isAuthenticated && user ? (
                    <UserMenu user={user} onLogout={onLogout} />
                ) : (
                    <button onClick={onLoginClick} className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-700`}>
                       Login
                    </button>
                )}
            </div>
        </header>
    );
};

const MobileNav: React.FC<{
    currentView: 'dashboard' | 'chat';
    setView: (view: 'dashboard' | 'chat') => void;
}> = ({ currentView, setView }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-30 flex justify-around items-center h-16">
            <button 
                onClick={() => setView('chat')} 
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${currentView === 'chat' ? 'text-blue-600' : 'text-slate-500'}`}
                aria-current={currentView === 'chat'}
            >
                <MessageSquarePlusIcon className="w-6 h-6" />
                <span className="text-xs font-semibold">Chat</span>
            </button>
            <button 
                onClick={() => setView('dashboard')} 
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}
                aria-current={currentView === 'dashboard'}
            >
                <LayoutDashboardIcon className="w-6 h-6" />
                <span className="text-xs font-semibold">Dashboard</span>
            </button>
        </nav>
    );
};


export default function App(): React.JSX.Element {
    type View = 'dashboard' | 'chat' | 'login';
    const [view, setView] = useState<View>('chat');
    const [lastView, setLastView] = useState<View>('chat');
    
    // Initialize with default data. Data from localStorage will be loaded in useEffect.
    const [faqs, setFaqs] = useState<Faq[]>(MOCK_FAQS);
    const [categories, setCategories] = useState<Category[]>(CATEGORIES);

    const [chatHistories, setChatHistories] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [translationHistory, setTranslationHistory] = useState<TranslationRecord[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load all data from localStorage on initial component mount.
    useEffect(() => {
        // Load user session
        let user: User | null = null;
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                user = JSON.parse(savedUser);
            }
        } catch (e) {
            console.error("Failed to load user from localStorage", e);
        }

        if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
        } else {
            setView('login');
        }

        // Load FAQs
        try {
            const savedFaqs = localStorage.getItem('campus_suite_faqs');
            if (savedFaqs) {
                setFaqs(JSON.parse(savedFaqs));
            }
        } catch (e) {
            console.error("Failed to load FAQs from localStorage", e);
        }

        // Load Categories
        try {
            const savedCategories = localStorage.getItem('campus_suite_categories');
            if (savedCategories) {
                const parsed: Omit<Category, 'icon'>[] = JSON.parse(savedCategories);
                const rehydrated = parsed.map(cat => ({
                    ...cat,
                    icon: iconMapById[cat.id] || BookOpenIcon,
                }));
                setCategories(rehydrated);
            }
        } catch (e) {
            console.error("Failed to load categories from localStorage", e);
        }
    }, []);
    
    // Persist FAQs to localStorage whenever they change.
    useEffect(() => {
        try {
            localStorage.setItem('campus_suite_faqs', JSON.stringify(faqs));
        } catch (e) {
            console.error("Failed to save FAQs to localStorage", e);
        }
    }, [faqs]);

    // Persist Categories to localStorage whenever they change.
    useEffect(() => {
        try {
            localStorage.setItem('campus_suite_categories', JSON.stringify(categories));
        } catch (e) {
            console.error("Failed to save categories to localStorage", e);
        }
    }, [categories]);

    useEffect(() => {
        if (!isAuthenticated && view !== 'login') {
            setView('login');
        }
    }, [isAuthenticated, view]);


    const handleLoginClick = () => {
        setLastView(view === 'login' ? 'chat' : view);
        setView('login');
    };

    const handleLoginSuccess = (user: User) => {
        setIsAuthenticated(true);
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setView(lastView);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setView('login');
    };

    const handleSetView = (newView: 'chat' | 'dashboard') => {
        if (isAuthenticated) {
            setView(newView);
        }
    };

    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            id: `chat-${Date.now()}`,
            title: "New Chat",
            timestamp: new Date().toISOString(),
            messages: [initialMessage],
        };
        setChatHistories(prev => [newSession, ...prev]);
        setActiveChatId(newSession.id);
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setChatHistories([]);
            setActiveChatId(null);
            setTranslationHistory([]);
            return;
        }

        // Load Chat History
        try {
            const historyKey = getUserStorageKey('chatHistories', currentUser);
            const activeIdKey = getUserStorageKey('activeChatId', currentUser);

            if (!historyKey || !activeIdKey) {
                 handleNewChat();
                 return;
            }
            
            const savedHistories = localStorage.getItem(historyKey);
            const histories: ChatSession[] = savedHistories ? JSON.parse(savedHistories) : [];
            setChatHistories(histories);

            if (histories.length > 0) {
                const lastActiveId = localStorage.getItem(activeIdKey);
                const validLastActiveId = lastActiveId && histories.some(h => h.id === lastActiveId);
                setActiveChatId(validLastActiveId ? lastActiveId : histories[0].id);
            } else {
                handleNewChat();
            }
        } catch (e) {
            console.error("Failed to load user-specific chat history from localStorage", e);
            handleNewChat();
        }

        // Load Translation History
        try {
            const transHistoryKey = getUserStorageKey('translationHistory', currentUser);
            if(transHistoryKey) {
                const savedTransHistory = localStorage.getItem(transHistoryKey);
                setTranslationHistory(savedTransHistory ? JSON.parse(savedTransHistory) : []);
            }
        } catch (e) {
            console.error("Failed to load translation history from localStorage", e);
            setTranslationHistory([]);
        }

    }, [currentUser, handleNewChat]);

    useEffect(() => {
        if (!currentUser) return;

        // Save Chat History
        if (chatHistories.length > 0) {
            const historyKey = getUserStorageKey('chatHistories', currentUser);
            const activeIdKey = getUserStorageKey('activeChatId', currentUser);

            if (historyKey) {
                localStorage.setItem(historyKey, JSON.stringify(chatHistories));
            }
            if (activeIdKey && activeChatId) {
                localStorage.setItem(activeIdKey, activeChatId);
            }
        }

        // Save Translation History
        const transHistoryKey = getUserStorageKey('translationHistory', currentUser);
        if (transHistoryKey) {
            localStorage.setItem(transHistoryKey, JSON.stringify(translationHistory));
        }

    }, [chatHistories, activeChatId, translationHistory, currentUser]);


    const handleUpdateHistory = (updatedSession: ChatSession) => {
        setChatHistories(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    };

    const handleAddCategory = (newCategory: Category) => {
        setCategories(prev => [...prev, newCategory]);
    };

    const renderContent = () => {
        if (!isAuthenticated) {
            return <LoginView onLoginSuccess={handleLoginSuccess} />;
        }
        
        switch (view) {
            case 'login':
                return <LoginView onLoginSuccess={handleLoginSuccess} />;
            case 'dashboard':
                return <DashboardView faqs={faqs} setFaqs={setFaqs} categories={categories} onAddCategory={handleAddCategory} />;
            case 'chat':
            default:
                return (
                    <ChatInterfaceView 
                        faqs={faqs} 
                        chatHistories={chatHistories}
                        activeChatId={activeChatId}
                        onUpdateHistory={handleUpdateHistory}
                        onNewChat={handleNewChat}
                        onSelectChat={setActiveChatId}
                        translationHistory={translationHistory}
                        onTranslationHistoryChange={setTranslationHistory}
                    />
                );
        }
    };

    return (
        <div className="font-sans text-slate-800">
            <AppHeader 
                currentView={view} 
                setView={handleSetView} 
                isAuthenticated={isAuthenticated}
                user={currentUser}
                onLoginClick={handleLoginClick}
                onLogout={handleLogout}
            />
            <div className="p-4 md:p-6 bg-slate-100 min-h-[calc(100vh-80px)] pb-24 md:pb-6">
                 {renderContent()}
            </div>
             {isAuthenticated && view !== 'login' && <MobileNav currentView={view} setView={handleSetView} />}
        </div>
    );
}