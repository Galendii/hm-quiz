import { REPUBLIC_SYSTEM_PROMPT, FALLBACK_QUESTIONS } from './prompts';
import type { Question } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class AiService {
    private apiKey: string;
    private history: string[] = [];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateQuestion(): Promise<Question> {
        // If no key locally, we try the backend proxy (Vercel)
        // If 'DEMO', we force fallback.
        if (this.apiKey === 'DEMO') {
            console.warn('AI Service: DEMO mode. Using fallback.');
            return this.getFallbackQuestion();
        }

        try {
            let url = '';
            let method = 'POST';
            let headers = { 'Content-Type': 'application/json' };
            let body = '';

            const payload = {
                contents: [{
                    parts: [{
                        text: `${REPUBLIC_SYSTEM_PROMPT}\n\nEvite repetir estas perguntas: ${this.history.join(', ')}`
                    }]
                }]
            };

            if (this.apiKey) {
                // Client-side call (Manual Key)
                url = `${GEMINI_API_URL}?key=${this.apiKey}`;
                body = JSON.stringify(payload);
            } else {
                // Backend Proxy call (Vercel)
                // Check if we are potentially strictly local (Vite dev server)
                // Note: 'vercel dev' would handle /api, but 'npm run dev' (vite) does not.
                // We'll try to detect if we are on a "dumb" local server.
                const isLocalhost = typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('192.168.'));

                if (isLocalhost) {
                    console.warn('AI Service: Running locally without Vercel Serverless (using Fallback).');
                    return this.getFallbackQuestion();
                }

                url = '/api/generate';
                body = JSON.stringify(payload);
            }

            const response = await fetch(url, { method, headers, body });

            if (!response.ok) {
                if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
                const errText = await response.text().catch(() => '');
                // If proxy fails (e.g. 404 locally), falling back is safer?
                // But let's log it.
                if (response.status === 404 && !this.apiKey) {
                    console.warn('Backend proxy not found (local dev without key?). Using fallback.');
                    return this.getFallbackQuestion();
                }
                throw new Error(`API Error ${response.status}: ${errText || response.statusText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error('Invalid AI response format');

            // Sanitize JSON (remove markdown code blocks if present)
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            const question: Question = {
                id: crypto.randomUUID(),
                text: parsed.question,
                options: parsed.options,
                correctIndex: parsed.correctIndex,
                context: parsed.context
            };

            this.history.push(question.text);
            return question;

        } catch (error: any) {
            console.error('AI Generation Failed:', error);
            if (error.message === 'QUOTA_EXCEEDED') {
                throw error; // Rethrow for Hard Shut
            }
            return this.getFallbackQuestion();
        }
    }

    private getFallbackQuestion(): Question {
        const random = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
        return {
            id: crypto.randomUUID(),
            text: random.question,
            options: random.options,
            correctIndex: random.correctIndex,
            context: random.context
        };
    }
}
