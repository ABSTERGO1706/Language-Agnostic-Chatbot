

import { GoogleGenAI, Chat, GenerateContentResponse, Type, Content } from "@google/genai";
import type { Faq, Language } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Function to build the knowledge base string from an array of FAQs
const buildFaqKnowledgeBase = (faqs: Faq[]): string => {
    if (!faqs || faqs.length === 0) {
        return `[
            { "intent": "Fallback", "response": "I'm sorry, I don't have information about that. For more complex questions, please contact the university's main information desk." }
        ]`;
    }
    
    // Filter out 'Draft' FAQs, only use 'Published' and 'Review'
    const usableFaqs = faqs.filter(faq => faq.status !== 'Draft');

    const knowledgeBase = usableFaqs.map(faq => ({
        intent: faq.question,
        response: faq.answer,
        status: faq.status, // Include the status for the AI to see
    }));
    return JSON.stringify(knowledgeBase, null, 2);
};

export const initializeChat = async (faqs: Faq[], history?: Content[], language: Language | 'auto' = 'auto'): Promise<Chat> => {
    const knowledgeBase = buildFaqKnowledgeBase(faqs);

    const languageInstruction = language === 'auto'
        ? `The user's language will be automatically detected. Your final response MUST be in that detected language.`
        : `Your final response MUST be in ${language}, regardless of the user's input language.`;

    const systemInstruction = `You are a helpful and friendly university campus assistant chatbot.
Your primary goal is to answer student questions based on the provided knowledge base. The answers in the knowledge base are in English.

**Core Workflow:**
1.  **Analyze Query:** Understand the student's question and detect their language.
2.  **Match Intent:** Match the query to the most relevant 'intent' (question) from the knowledge base.
3.  **Retrieve English Answer:** Get the corresponding English 'response' (answer) from the matched knowledge base entry.
4.  **Translate and Respond:** Translate the English answer into the student's language and provide it in the final JSON output. If the student's language is English, no translation is needed.
5.  **Out of Scope:** If the query is outside the scope of the knowledge base, use the 'Fallback' intent and translate its response as well.

**Language Mandate:**
${languageInstruction}

**Special Rule for 'In Review' Content:**
If you use a response from a knowledge base item where the \`status\` is "Review", you MUST prepend your final answer (after translation) with the translated equivalent of: "Please note: This information is not completely certain and may change.\\n\\n"

**Knowledge Base (FAQ - All answers are in English):**
---
${knowledgeBase}
---

**JSON Output Mandate:**
You MUST provide your answer in a single, minified JSON object. Do not add any text, markdown, or commentary before or after the JSON object. The JSON object must have these exact keys:
*   \`"detected_language"\`: The language you detected from the user's input (e.g., "English", "Hindi"). This should reflect the user's language.
*   \`"intent"\`: The 'intent' you identified from the knowledge base.
*   \`"response"\`: The final, student-friendly answer, which MUST be in the student's language.

**Example User Query (in Hindi):** "लाइब्रेरी का समय?"
**Example JSON Output:** \`{"detected_language":"Hindi","intent":"Library Hours","response":"मुख्य पुस्तकालय सप्ताह के दिनों में सुबह 8 बजे से रात 11 बजे तक और सप्ताहांत पर सुबह 10 बजे से रात 8 बजे तक खुला रहता है। छुट्टियों के दौरान घंटे भिन्न हो सकते हैं।"}\`
`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    detected_language: { type: Type.STRING },
                    intent: { type: Type.STRING },
                    response: { type: Type.STRING },
                },
                required: ["detected_language", "intent", "response"],
            }
        },
    });
    return chat;
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};

const getTranslationPrompt = (instructions: string) => `You are a professional document translation assistant. Your task is to translate documents between English and Hindi.

**Core Instructions:**
1.  **Auto-Detect Language:** Automatically detect if the provided document is primarily in English or Hindi.
2.  **Translate:**
    *   If the document is English, translate it to Hindi.
    *   If it's Hindi, translate it to English.
3.  **Preserve Formatting:** Critically, preserve the original document's structure and formatting (paragraphs, headings, lists, indentation) as best as possible in the plain text output.
4.  **Follow User Instructions:** Adhere carefully to any specific instructions provided by the user.
5.  **Accuracy:** Ensure the translation is accurate and natural.
6.  **Untranslatable Content:** If a section is ambiguous, translate it as best you can and mark it clearly for user review, like: \`[USER REVIEW NEEDED: ...original text...]\`.

**User's Specific Instructions:**
---
${instructions || 'None'}
---

**JSON Output Mandate:**
Return the result as a single, minified JSON object. Do not add any extra commentary before or after the JSON.
*   \`"detected_language"\`: The language you detected in the source document (either "English" or "Hindi").
*   \`"translated_text"\`: The translated text.
Example: \`{"detected_language":"English", "translated_text":"यह अनुवादित पाठ है।"}\`
`;

export interface TranslationResult {
    detected_language: string;
    translated_text: string;
}

export const translateDocument = async (text: string, instructions: string): Promise<TranslationResult> => {
    const systemInstruction = getTranslationPrompt(instructions);
    const contents = `**Document to Translate:**\n---\n${text}\n---`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    detected_language: { type: Type.STRING },
                    translated_text: { type: Type.STRING } 
                },
                required: ["detected_language", "translated_text"],
            }
        }
    });

    return JSON.parse(response.text);
};

export const translateFile = async (fileData: string, mimeType: string, instructions: string): Promise<TranslationResult> => {
    const systemInstruction = getTranslationPrompt(instructions);
    
    const filePart = {
        inlineData: {
            data: fileData,
            mimeType,
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // This model can handle multimodal inputs
        contents: { parts: [filePart] },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    detected_language: { type: Type.STRING },
                    translated_text: { type: Type.STRING } 
                },
                required: ["detected_language", "translated_text"],
            }
        }
    });
    
    return JSON.parse(response.text);
};