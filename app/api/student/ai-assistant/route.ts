import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `
You are VIQ AI Mentor, an elite coding and technical engineering assistant embedded inside the Student Portal of VIQ Technologies.

CRITICAL INSTRUCTIONS:
1. Language Flexibility:
   - You MUST fluently understand and reply in both Hinglish (Roman Hindi + English mixed) and pure English.
   - If the student asks in Hinglish, reply in friendly, clear Hinglish with code.
   - If the student asks in English, reply in professional technical English.
   - If the student asks in Hindi, reply comfortably in Hinglish.

2. Code Quality:
   - Always provide production-ready, clean, well-commented code (React, Next.js, Node.js, Express, MongoDB, PostgreSQL, Java, Python, DSA).
   - Use clean Markdown code blocks with language identifiers.

3. Step-by-Step Guidance:
   - Identify bugs directly, explain the root cause, and show the exact fix clearly.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages are required.', { status: 400 });
    }

    const encoder = new TextEncoder();

    console.log('[AI Gateway] Active Keys Detected:', {
      groq: Boolean(process.env.GROQ_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    });

    // =========================================================================
    // 1. FIRST PRIORITY: GROQ STREAMING (Fastest)
    // =========================================================================
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const groqStream = await groq.chat.completions.create({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
              content: m.content,
            })),
          ],
          temperature: 0.3,
          max_tokens: 2048,
          stream: true,
        });

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of groqStream) {
                const text = chunk.choices[0]?.delta?.content || '';
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-AI-Provider': 'Groq (Llama-3.1)',
          },
        });
      } catch (groqErr: any) {
        console.error('❌ Groq Stream Failed:', groqErr?.message || groqErr);
      }
    }

    // =========================================================================
    // 2. SECOND PRIORITY: GOOGLE GEMINI STREAMING (Fallback 1)
    // =========================================================================
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.8-flash', // using standard 1.5 flash to avoid 404
          systemInstruction: SYSTEM_PROMPT,
        });

        const formattedHistory = messages
          .filter((m: { content: string }) => Boolean(m.content?.trim()))
          .map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          }));

        if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
          formattedHistory.shift();
        }

        const lastUserPrompt = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || 'Hello';

        const resultStream = await model.generateContentStream({
          contents: formattedHistory.length > 0 
            ? formattedHistory 
            : [{ role: 'user', parts: [{ text: lastUserPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        });

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of resultStream.stream) {
                const text = chunk.text();
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-AI-Provider': 'Google Gemini',
          },
        });
      } catch (geminiErr: any) {
        console.error('❌ Gemini Stream Failed:', geminiErr?.message || geminiErr);
      }
    }

    // =========================================================================
    // 3. THIRD PRIORITY: OPENAI STREAMING (Fallback 2)
    // =========================================================================
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const oaiStream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
              content: m.content,
            })),
          ],
          temperature: 0.3,
          stream: true,
        });

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of oaiStream) {
                const text = chunk.choices[0]?.delta?.content || '';
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-AI-Provider': 'OpenAI (GPT-4o-mini)',
          },
        });
      } catch (openaiErr: any) {
        console.error('❌ OpenAI Stream Failed:', openaiErr?.message || openaiErr);
      }
    }

    return new Response('All AI models failed to stream.', { status: 503 });
  } catch (error: any) {
    console.error('Fatal AI Route Error:', error);
    return new Response(error?.message || 'Internal AI Server Error', { status: 500 });
  }
}