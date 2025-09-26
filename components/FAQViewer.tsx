import React, { useState } from 'react';
import { ChevronDownIcon, PlusIcon } from './Icons';
// Fix: Corrected type import from 'FAQ' to 'Faq'.
import type { Faq } from '../types';

interface FAQViewerProps {
    // Fix: Corrected type from 'FAQ[]' to 'Faq[]'.
    faqs: Faq[];
    // Fix: Corrected type from 'FAQ[]' to 'Faq[]'.
    onFaqsChange: React.Dispatch<React.SetStateAction<Faq[]>>;
    isReadOnly?: boolean;
}

// Fix: Corrected type from 'FAQ' to 'Faq'.
const AddFaqForm: React.FC<{ onAdd: (faq: Faq) => void }> = ({ onAdd }) => {
    // Fix: Renamed state to align with the 'Faq' type properties.
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && answer.trim()) {
            // Fix: Create a complete 'Faq' object with default values for fields not in the form.
            const newFaq: Faq = {
                id: `faq-${Date.now()}`,
                question,
                answer,
                category: 'admissions', // Default category
                status: 'Draft',       // Default status
                languages: ['English'],  // Default language
                last_updated: new Date().toISOString(),
                editor: 'Current User' // Default editor
            };
            onAdd(newFaq);
            setQuestion('');
            setAnswer('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <h3 className="font-semibold text-slate-700">Add New FAQ</h3>
            <div>
                {/* Fix: Updated labels and state for 'question'. */}
                <label htmlFor="question-input" className="block text-sm font-medium text-slate-600 mb-1">Question (Topic)</label>
                <input 
                    id="question-input"
                    type="text" 
                    value={question} 
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="e.g., Library Timings"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                {/* Fix: Updated labels and state for 'answer'. */}
                <label htmlFor="answer-input" className="block text-sm font-medium text-slate-600 mb-1">Answer</label>
                <textarea 
                    id="answer-input"
                    value={answer} 
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="The library is open from 9 AM to 8 PM..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
            </div>
            <button
                type="submit"
                disabled={!question.trim() || !answer.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                <PlusIcon className="w-5 h-5" />
                Add FAQ
            </button>
        </form>
    );
};


export const FAQViewer: React.FC<FAQViewerProps> = ({ faqs, onFaqsChange, isReadOnly = false }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    // Fix: Corrected type from 'FAQ' to 'Faq'.
    const handleAddFaq = (newFaq: Faq) => {
        onFaqsChange(prevFaqs => [newFaq, ...prevFaqs]);
    };
    
    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const isLoading = faqs.length === 0;

    return (
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-full max-h-[70vh]">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-700">FAQ Knowledge Base</h2>
                <p className="text-sm text-slate-500">The assistant uses this information to answer questions.</p>
            </div>

            {!isReadOnly && <AddFaqForm onAdd={handleAddFaq} />}
            
            <div className="p-4 flex-1 overflow-y-auto">
                {isLoading && <p className="text-slate-500">Loading FAQs...</p>}
                {!isLoading && (
                    <div className="space-y-2">
                        {faqs.map((faq, index) => (
                            // Fix: Use a more robust key. 'question' is more descriptive than 'intent'.
                            <div key={`${faq.id}-${index}`} className="border border-slate-200 rounded-lg">
                                <button 
                                  onClick={() => toggleFAQ(index)}
                                  className="w-full flex justify-between items-center p-3 text-left font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                  aria-expanded={openIndex === index}
                                >
                                    {/* Fix: Changed property from 'intent' to 'question'. */}
                                    <span className="flex-1 pr-2">{faq.question}</span>
                                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} />
                                </button>
                                {openIndex === index && (
                                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                                        {/* Fix: Changed property from 'response' to 'answer'. */}
                                        <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};