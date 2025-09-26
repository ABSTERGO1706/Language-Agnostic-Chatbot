

import React, { useState, useCallback, useEffect } from 'react';
import { translateDocument, translateFile, TranslationResult } from '../services/geminiService';
import { UploadIcon, TranslateIcon, TrashIcon, DownloadIcon, ArrowLeftIcon, FileTextIcon, PlusIcon, SpinnerIcon, MenuIcon } from './Icons';
import type { TranslationRecord } from '../types';

interface UploadedFile {
    name: string;
    type: string;
    data: string; // base64 encoded data
}

const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday`;
    }
    return date.toLocaleDateString();
};

const TranslationHistorySidebar: React.FC<{
    history: TranslationRecord[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}> = ({ history, activeId, onSelect, onNew, onDelete }) => {
    return (
        <aside className="bg-slate-800 text-slate-200 flex flex-col w-72 border-r border-slate-700 h-full">
            <div className="p-3 border-b border-slate-700">
                <button 
                    onClick={onNew} 
                    className="w-full flex items-center justify-center gap-2 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors px-3 py-2"
                    title="New Translation"
                >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">New Translation</span>
                </button>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {history.length === 0 && (
                    <div className="text-center p-4 text-sm text-slate-400">No history yet.</div>
                )}
                {history.map(record => {
                    const title = record.originalFileName || record.originalText?.substring(0, 40) || 'Untitled';
                    return (
                        <div key={record.id} className="relative group">
                             <button
                                onClick={() => onSelect(record.id)}
                                className={`w-full text-left rounded-lg transition-colors p-3 ${record.id === activeId ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
                                title={title}
                            >
                                <div className={`flex-1 overflow-hidden ${record.id === activeId ? 'text-white' : 'text-slate-300'}`}>
                                    <p className="font-semibold text-sm truncate flex items-center gap-2">
                                        {record.originalFileName && <FileTextIcon className="w-4 h-4 flex-shrink-0"/>}
                                        {title}
                                    </p>
                                    <p className={`text-xs mt-1 ${record.id === activeId ? 'text-blue-400' : 'text-slate-400'}`}>{formatDate(record.timestamp)}</p>
                                </div>
                            </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                                className="absolute top-2 right-2 p-1 rounded-md bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-opacity"
                                title="Delete translation"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};


interface DocumentTranslatorProps {
    setView: (view: 'chat' | 'documents') => void;
    history: TranslationRecord[];
    onHistoryChange: (newHistory: TranslationRecord[]) => void;
}

export const DocumentTranslator: React.FC<DocumentTranslatorProps> = ({ setView, history, onHistoryChange }) => {
    const [inputText, setInputText] = useState<string>('');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [instructions, setInstructions] = useState<string>('');
    const [translatedText, setTranslatedText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
    const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const activeRecord = history.find(r => r.id === activeRecordId) || null;

    useEffect(() => {
        if (activeRecord) {
            setInputText(activeRecord.originalText || '');
            setTranslatedText(activeRecord.translatedText);
            setInstructions(activeRecord.instructions);
            if (activeRecord.originalFileName) {
                // Cannot restore file object, but can show info
                setUploadedFile({ name: activeRecord.originalFileName, type: 'from-history', data: '' });
            } else {
                setUploadedFile(null);
            }
             if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } else {
            // New translation state
            setInputText('');
            setUploadedFile(null);
            setInstructions('');
            setTranslatedText('');
        }
    }, [activeRecord]);

    useEffect(() => {
        if (fileError) {
            const timer = setTimeout(() => setFileError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [fileError]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const allowedTypes = ['text/plain', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setFileError('Unsupported file type. Please upload a .txt or .pdf file.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setFileError(null);
            setActiveRecordId(null); // New action, so deselect history
            setIsFileProcessing(true);
            setUploadedFile(null); 
            setInputText(''); 

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const base64Data = dataUrl.split(',')[1];
                setUploadedFile({ name: file.name, type: file.type, data: base64Data });
                setIsFileProcessing(false);
            };
            reader.onerror = () => {
                console.error("Error reading file.");
                setFileError("An error occurred while reading the file.");
                setIsFileProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleTranslate = useCallback(async () => {
        const hasText = inputText.trim();
        const hasFile = uploadedFile;
        if ((!hasText && !hasFile) || isLoading) return;
        
        setIsLoading(true);
        setTranslatedText('');

        try {
            let result: TranslationResult;
            
            if (hasFile && hasFile.type !== 'from-history') {
                result = await translateFile(uploadedFile.data, uploadedFile.type, instructions);
            } else {
                result = await translateDocument(inputText, instructions);
            }
            
            setTranslatedText(result.translated_text);

            const newRecord: TranslationRecord = {
                id: `trans-${Date.now()}`,
                timestamp: new Date().toISOString(),
                originalText: hasFile ? undefined : inputText,
                originalFileName: hasFile ? hasFile.name : undefined,
                translatedText: result.translated_text,
                instructions: instructions,
            };
            onHistoryChange([newRecord, ...history]);
            setActiveRecordId(newRecord.id);


        } catch (error) {
            console.error("Translation error:", error);
            const errorMessage = "An error occurred during translation. The file format might not be supported, or there was a network issue. Please try again.";
            setTranslatedText(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, uploadedFile, instructions, isLoading, history, onHistoryChange]);

    const handleNewTranslation = () => {
        setActiveRecordId(null);
        setFileError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteRecord = (id: string) => {
        const newHistory = history.filter(r => r.id !== id);
        onHistoryChange(newHistory);
        if (activeRecordId === id) {
            setActiveRecordId(null);
        }
    };

    const handleDownload = () => {
        if (!translatedText) return;
        const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'translated-document.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const isTranslateDisabled = isLoading || isFileProcessing || (!inputText.trim() && !uploadedFile);

    return (
        <div className="bg-white rounded-xl shadow-lg flex h-[calc(100vh-165px)] overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <div className={`md:hidden fixed inset-0 z-40 flex transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full">
                    <TranslationHistorySidebar 
                        history={history}
                        activeId={activeRecordId}
                        onSelect={(id) => { setActiveRecordId(id); setIsSidebarOpen(false); }}
                        onNew={() => { handleNewTranslation(); setIsSidebarOpen(false); }}
                        onDelete={handleDeleteRecord}
                    />
                </div>
                <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                 <TranslationHistorySidebar 
                    history={history}
                    activeId={activeRecordId}
                    onSelect={setActiveRecordId}
                    onNew={handleNewTranslation}
                    onDelete={handleDeleteRecord}
                />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <button className="md:hidden p-1 -ml-1 text-slate-600" onClick={() => setIsSidebarOpen(true)} aria-label="Open translation history">
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">Document Translator</h2>
                    </div>
                    <button 
                        onClick={() => setView('chat')}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition"
                        aria-label="Back to chat"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </button>
                </div>

                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                    {/* Input Area */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="font-semibold text-slate-600">Original Document</label>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 transition"
                                aria-label="Upload a file"
                            >
                                <UploadIcon className="w-4 h-4" />
                                Upload File
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              accept=".txt,.pdf"
                            />
                        </div>
                        {fileError && <p className="text-xs text-red-600 -mt-1">{fileError}</p>}
                        <div className="relative w-full h-full border border-slate-300 rounded-md">
                            <textarea
                                value={inputText}
                                onChange={(e) => { setInputText(e.target.value); setUploadedFile(null); setActiveRecordId(null); }}
                                placeholder="Paste or type your text here..."
                                className="w-full h-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none rounded-md"
                                aria-label="Original text input area"
                                disabled={!!uploadedFile || isFileProcessing}
                            />
                             {isFileProcessing && (
                                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 rounded-md">
                                    <p className="font-semibold text-slate-700 animate-pulse">Processing file...</p>
                                </div>
                             )}
                             {uploadedFile && !isFileProcessing && (
                                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 rounded-md text-center">
                                    <p className="font-semibold text-slate-700 break-all">{uploadedFile.name}</p>
                                    <p className="text-sm text-slate-500">{uploadedFile.type === 'from-history' ? 'Loaded from history' : `Type: ${uploadedFile.type}`}</p>
                                    <button
                                        onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="mt-2 text-sm text-red-600 hover:underline"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Area */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="font-semibold text-slate-600">Translated Document</label>
                             <button 
                                onClick={handleDownload}
                                disabled={!translatedText || isLoading}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 transition disabled:opacity-50"
                                aria-label="Download translated text"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                        <div className="w-full h-full p-2 bg-slate-100 border border-slate-300 rounded-md overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <SpinnerIcon className="w-6 h-6 text-slate-500" />
                                </div>
                            ) : (
                                <p className="text-slate-800 whitespace-pre-wrap">{translatedText || 'Translation will appear here...'}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                            type="text"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Optional: Add specific instructions (e.g., 'keep names in English')"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Translation instructions"
                        />
                        <button 
                            onClick={handleTranslate}
                            disabled={isTranslateDisabled}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex-shrink-0"
                        >
                           {isLoading ? <><SpinnerIcon className="w-5 h-5 mr-2" />Translating...</> : <><TranslateIcon className="w-5 h-5" /> Translate</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
