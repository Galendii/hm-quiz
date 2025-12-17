import { REPUBLIC_SYSTEM_PROMPT, FALLBACK_QUESTIONS } from './prompts';
import type { Question } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

export class AiService {
    private apiKey: string;
    private poolKey = 'hm_question_pool';
    private historyKey = 'hm_question_history';
    public isPreloading = false;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private getHistory(): string[] {
        const stored = localStorage.getItem(this.historyKey);
        return stored ? JSON.parse(stored) : [];
    }

    public saveHistory(text: string) {
        const history = this.getHistory();
        if (!history.includes(text)) {
            history.push(text);
            localStorage.setItem(this.historyKey, JSON.stringify(history.slice(-100))); // Keep last 100
        }
    }

    private getPool(): Question[] {
        const stored = localStorage.getItem(this.poolKey);
        return stored ? JSON.parse(stored) : [];
    }

    private savePool(pool: Question[]) {
        localStorage.setItem(this.poolKey, JSON.stringify(pool));
    }

    async preloadQuestions(count: number = 10): Promise<void> {
        let pool = this.getPool();
        if (pool.length >= count) return;

        this.isPreloading = true;
        console.log(`AiService: Preloading ${count - pool.length} questions...`);
        try {
            const batch = await this.generateBatch(count - pool.length);
            pool = [...pool, ...batch];
            this.savePool(pool);
        } catch (error) {
            console.error('Failed to preload questions:', error);
        } finally {
            this.isPreloading = false;
        }
    }

    async getNextQuestion(): Promise<Question> {
        let pool = this.getPool();

        if (pool.length === 0) {
            console.warn('AiService: Pool empty. Generating on the fly.');
            return this.generateQuestion();
        }

        const question = pool.shift()!;
        this.savePool(pool);

        // Async background refill if low
        if (pool.length < 5) {
            this.preloadQuestions(10).catch(() => { });
        }

        return question;
    }

    async generateBatch(count: number): Promise<Question[]> {
        if (this.apiKey === 'DEMO') {
            return Array.from({ length: count }, () => this.getFallbackQuestion());
        }

        const history = this.getHistory();
        const prompt = `${REPUBLIC_SYSTEM_PROMPT}\n\nGere EXATAMENTE ${count} perguntas variadas.\nEvite repetir estas perguntas já feitas: ${history.join(', ')}`;

        try {
            const data = await this.fetchGemini(prompt);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Invalid AI response format');

            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            if (!Array.isArray(parsed)) throw new Error('AI did not return an array');

            return parsed.map((p: any) => ({
                id: crypto.randomUUID(),
                text: p.question,
                options: p.options,
                correctIndex: p.correctIndex,
                context: p.context
            }));
        } catch (error) {
            console.error('Batch generation failed:', error);
            return Array.from({ length: count }, () => this.getFallbackQuestion());
        }
    }

    async generateQuestion(): Promise<Question> {
        const batch = await this.generateBatch(1);
        return batch[0];
    }

    private async fetchGemini(prompt: string): Promise<any> {
        let url = '';
        let body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        if (this.apiKey) {
            url = `${GEMINI_API_URL}?key=${this.apiKey}`;
        } else {
            const isLocalhost = typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('192.168.'));

            if (isLocalhost) {
                throw new Error('Localhost without key - forcing fallback');
            }
            url = '/api/generate';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });

        if (!response.ok) {
            if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
            throw new Error(`API Error ${response.status}`);
        }

        return response.json();
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
