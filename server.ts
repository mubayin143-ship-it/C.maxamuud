import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent disk cache directory
const TTS_CACHE_DIR = path.join(__dirname, '.tts_cache');
if (!fs.existsSync(TTS_CACHE_DIR)) {
  fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

function getDiskCachePath(cacheKey: string): string {
  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex');
  return path.join(TTS_CACHE_DIR, `${hash}.json`);
}

/**
 * Converts raw 24kHz 16-bit Mono Linear PCM into a standard, fully valid RIFF/WAV container.
 * Gemini TTS returns raw PCM (audio/L16;codec=pcm;rate=24000) which requires a 44-byte RIFF
 * header to decode and play audibly in browser HTML5 Audio and media players.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  if (pcmBuffer.length >= 12 && pcmBuffer.subarray(0, 4).toString() === 'RIFF') {
    return pcmBuffer;
  }
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

// In-memory audio cache for frequent phrases (e.g. greetings)
const ttsAudioCache = new Map<
  string,
  { audioBase64: string; mimeType: string; voiceId: string; model?: string }
>();

// Canonical Neural Voice Profiles for supported languages
export const NEURAL_VOICE_PROFILES: Record<string, { female: string; male: string }> = {
  en: { female: 'Kore', male: 'Puck' },
  ar: { female: 'Kore', male: 'Puck' },
  so: { female: 'Kore', male: 'Puck' },
  sw: { female: 'Kore', male: 'Puck' },
  tr: { female: 'Kore', male: 'Puck' },
  fr: { female: 'Kore', male: 'Puck' },
  de: { female: 'Kore', male: 'Puck' },
  es: { female: 'Kore', male: 'Puck' },
  ru: { female: 'Kore', male: 'Puck' },
  ur: { female: 'Kore', male: 'Puck' },
  it: { female: 'Kore', male: 'Puck' },
  pt: { female: 'Kore', male: 'Puck' },
  zh: { female: 'Kore', male: 'Puck' },
};

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  // Dev server must strictly run on port 3000. In production, use process.env.PORT if specified.
  const PORT = isProd && process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check & capabilities endpoint
  app.get('/api/health', (req, res) => {
    const isExhausted = Date.now() < ttsDailyQuotaExhaustedUntil;
    const remainingSec = isExhausted ? Math.max(1, Math.ceil((ttsDailyQuotaExhaustedUntil - Date.now()) / 1000)) : 0;
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      provider: 'neural_gemini_tts',
      quotaExhausted: isExhausted,
      quotaRetryAfter: remainingSec,
    });
  });

  // Rate-limiting cooldown for Neural TTS
  let ttsRateLimitCooldownUntil = 0;
  // Daily quota exhaustion tracking to prevent wasted retry calls to Google Gemini
  let ttsDailyQuotaExhaustedUntil = 0;

  // Server-side single-flight execution queue for external Neural TTS requests
  let ttsServerQueue: Promise<void> = Promise.resolve();

  // Secure Server-Side Neural TTS API Endpoint
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, language = 'en', gender = 'female', recheck = false } = req.body;

      if (recheck === true) {
        console.log('[Neural TTS] Manual recheck requested: resetting cooldown flags.');
        ttsDailyQuotaExhaustedUntil = 0;
        ttsRateLimitCooldownUntil = 0;
      }

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text string is required' });
      }

      const cleanText = text
        .replace(/[*_#`~[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        return res.status(400).json({ error: 'Text cannot be empty' });
      }

      const langKey = language.toLowerCase().split('-')[0];
      const selectedGender: 'female' | 'male' = gender === 'male' ? 'male' : 'female';
      const voiceId = selectedGender === 'male' ? 'Puck' : 'Kore';

      // 1. Check memory cache first
      const cacheKey = `${langKey}_${selectedGender}_${voiceId}_${cleanText}`;
      if (ttsAudioCache.has(cacheKey)) {
        const cached = ttsAudioCache.get(cacheKey)!;
        const buf = Buffer.from(cached.audioBase64, 'base64');
        const wavBuf = pcmToWav(buf, 24000, 1, 16);
        const wavBase64 = wavBuf.toString('base64');
        return res.json({
          provider: 'neural_gemini_tts',
          model: (cached as any).model || 'gemini-3.8-flash-tts',
          voiceId: cached.voiceId,
          audioBase64: wavBase64,
          mimeType: 'audio/wav',
          cached: true,
          gender: selectedGender,
        });
      }

      // 2. Check persistent disk cache
      const diskPath = getDiskCachePath(cacheKey);
      if (fs.existsSync(diskPath)) {
        try {
          const diskData = JSON.parse(fs.readFileSync(diskPath, 'utf-8'));
          if (diskData.audioBase64) {
            const buf = Buffer.from(diskData.audioBase64, 'base64');
            const wavBuf = pcmToWav(buf, 24000, 1, 16);
            const wavBase64 = wavBuf.toString('base64');
            diskData.audioBase64 = wavBase64;
            diskData.mimeType = 'audio/wav';
            ttsAudioCache.set(cacheKey, diskData);
            return res.json({
              provider: 'neural_gemini_tts',
              model: diskData.model || 'gemini-3.8-flash-tts',
              voiceId: diskData.voiceId,
              audioBase64: wavBase64,
              mimeType: 'audio/wav',
              cached: true,
              gender: selectedGender,
            });
          }
        } catch {
          // safe ignore read errors
        }
      }

      // If daily quota is already known to be exhausted and phrase is not in cache, reject immediately without queueing
      if (Date.now() < ttsDailyQuotaExhaustedUntil) {
        const remainingSec = Math.max(1, Math.ceil((ttsDailyQuotaExhaustedUntil - Date.now()) / 1000));
        res.setHeader('Retry-After', String(Math.min(remainingSec, 3600)));
        return res.status(429).json({
          error: 'QUOTA_EXHAUSTED',
          quotaExhausted: true,
          provider: 'neural_gemini_tts',
          retryAfter: remainingSec,
          message: 'Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.',
        });
      }

      // 3. Execute external Gemini call strictly through the server-side queue (concurrency = 1)
      const executeTtsTask = async () => {
        // Re-check memory cache in case a previously queued task generated the identical audio
        if (ttsAudioCache.has(cacheKey)) {
          const cached = ttsAudioCache.get(cacheKey)!;
          const buf = Buffer.from(cached.audioBase64, 'base64');
          const wavBuf = pcmToWav(buf, 24000, 1, 16);
          const wavBase64 = wavBuf.toString('base64');
          return res.json({
            provider: 'neural_gemini_tts',
            model: (cached as any).model || 'gemini-3.8-flash-tts',
            voiceId: cached.voiceId,
            audioBase64: wavBase64,
            mimeType: 'audio/wav',
            cached: true,
            gender: selectedGender,
          });
        }

        // Check if daily quota is known to be exhausted to prevent wasting requests to Google Gemini
        if (Date.now() < ttsDailyQuotaExhaustedUntil) {
          const remainingSec = Math.max(1, Math.ceil((ttsDailyQuotaExhaustedUntil - Date.now()) / 1000));
          res.setHeader('Retry-After', String(Math.min(remainingSec, 3600)));
          return res.status(429).json({
            error: 'QUOTA_EXHAUSTED',
            quotaExhausted: true,
            provider: 'neural_gemini_tts',
            retryAfter: remainingSec,
            message: 'Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.',
          });
        }

        // Check server-side cooldown before making external API call to protect quota
        if (Date.now() < ttsRateLimitCooldownUntil) {
          const remainingSec = Math.max(1, Math.ceil((ttsRateLimitCooldownUntil - Date.now()) / 1000));
          res.setHeader('Retry-After', String(remainingSec));
          return res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            provider: 'neural_gemini_tts',
            retryAfter: remainingSec,
            message: 'Voice is temporarily busy. Your text is still available.',
          });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(503).json({
            error: 'NOT_CONFIGURED',
            provider: 'neural_gemini_tts',
            message: 'Server GEMINI_API_KEY is not configured',
          });
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const TTS_MODELS = [
          'gemini-3.8-flash-tts',
          'gemini-3.8-flash-lite-tts',
        ];

        let audioBase64: string | null = null;
        let usedModel: string = TTS_MODELS[0];
        let lastErr: any = null;

        for (const model of TTS_MODELS) {
          try {
            console.log(`[Neural TTS] Requesting model ${model} (voice: ${voiceId}, lang: ${langKey})...`);
            const response = await ai.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [{ text: cleanText }],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceId },
                  },
                },
              },
            });

            const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
            if (rawBase64) {
              usedModel = model;
              const pcmBuffer = Buffer.from(rawBase64, 'base64');
              const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
              audioBase64 = wavBuffer.toString('base64');
              console.log(`[Neural TTS] Successfully synthesized audio via ${model} (${audioBase64.length} chars)`);
              break;
            }
          } catch (err: any) {
            lastErr = err;
            const errStr = typeof err?.message === 'string' ? err.message : JSON.stringify(err);
            console.warn(`[Neural TTS] Model ${model} generation failed (status ${err?.status}):`, errStr.slice(0, 150));
            // Try fallback model if available
            continue;
          }
        }

        if (!audioBase64) {
          throw lastErr || new Error('No audio data received from Gemini Neural TTS model');
        }

        // Safe cache size maintenance (max 150 items)
        if (ttsAudioCache.size >= 150) {
          const oldestKey = ttsAudioCache.keys().next().value;
          if (oldestKey) ttsAudioCache.delete(oldestKey);
        }
        ttsAudioCache.set(cacheKey, { audioBase64, mimeType: 'audio/wav', voiceId, model: usedModel });
        try {
          fs.writeFileSync(
            diskPath,
            JSON.stringify({ audioBase64, mimeType: 'audio/wav', voiceId, model: usedModel })
          );
        } catch {
          // safe ignore write errors
        }

        return res.json({
          provider: 'neural_gemini_tts',
          model: usedModel,
          voiceId,
          audioBase64,
          mimeType: 'audio/wav',
          cached: false,
          gender: selectedGender,
        });
      };

      // Chain through single-flight queue to eliminate concurrent external calls
      const taskPromise = ttsServerQueue.then(executeTtsTask, executeTtsTask);
      ttsServerQueue = taskPromise.then(() => {}, () => {});
      await taskPromise;
    } catch (err: any) {
      const errStr = typeof err?.message === 'string' ? err.message : JSON.stringify(err);
      const isQuotaExceeded =
        err?.status === 429 ||
        err?.status === 'RESOURCE_EXHAUSTED' ||
        errStr.includes('429') ||
        errStr.includes('quota') ||
        errStr.includes('RESOURCE_EXHAUSTED');

      if (isQuotaExceeded) {
        let retryDelaySec = 6;
        let isDailyQuotaExhausted = false;

        try {
          if (errStr.includes('GenerateRequestsPerDayPerProjectPerModel-FreeTier') || errStr.includes('limit: 10')) {
            isDailyQuotaExhausted = true;
          }
          if (Array.isArray(err?.details)) {
            const retryInfo = err.details.find((d: any) => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
              const parsed = parseInt(retryInfo.retryDelay, 10);
              if (!isNaN(parsed) && parsed > 0) retryDelaySec = parsed;
            }
          } else if (errStr.includes('retry in ')) {
            const match = errStr.match(/retry in\s+([0-9hms.]+)/);
            if (match && match[1]) {
              let total = 0;
              const h = match[1].match(/(\d+)h/);
              const m = match[1].match(/(\d+)m/);
              const s = match[1].match(/(\d+)s/);
              if (h) total += parseInt(h[1], 10) * 3600;
              if (m) total += parseInt(m[1], 10) * 60;
              if (s) total += parseInt(s[1], 10);
              if (total > 0) retryDelaySec = total;
            }
          }
        } catch {
          // safe ignore parse
        }

        if (retryDelaySec > 60) {
          isDailyQuotaExhausted = true;
        }

        if (isDailyQuotaExhausted) {
          console.warn(`[Neural TTS] Daily free-tier quota (10 requests/day) exhausted on Google Gemini (retryDelay=${retryDelaySec}s).`);
          ttsDailyQuotaExhaustedUntil = Date.now() + Math.max(retryDelaySec, 3600) * 1000;
          ttsRateLimitCooldownUntil = ttsDailyQuotaExhaustedUntil;
          res.setHeader('Retry-After', String(retryDelaySec));
          return res.status(429).json({
            error: 'QUOTA_EXHAUSTED',
            quotaExhausted: true,
            provider: 'neural_gemini_tts',
            retryAfter: retryDelaySec,
            message: 'Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.',
          });
        }

        console.warn(`[Neural TTS] Temporary rate limit on provider (cooldown=${retryDelaySec}s).`);
        const cooldownSec = Math.max(1, Math.min(retryDelaySec, 10));
        ttsRateLimitCooldownUntil = Date.now() + cooldownSec * 1000;
        res.setHeader('Retry-After', String(cooldownSec));
        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          quotaExhausted: false,
          provider: 'neural_gemini_tts',
          retryAfter: cooldownSec,
          message: 'Voice is temporarily busy. Your text is still available.',
        });
      }

      console.warn('[Neural TTS] Generation error:', errStr.slice(0, 150));
      return res.status(503).json({
        error: 'TTS_GENERATION_FAILED',
        provider: 'neural_gemini_tts',
        message: 'Neural TTS is temporarily unavailable.',
      });
    }
  });

  // Rate-limiting cooldown and cache for Handwriting Recognition
  let handwritingCooldownUntil = 0;
  const handwritingCache = new Map<string, any>();

  // Secure Server-Side AI Handwriting Recognition Endpoint
  app.post('/api/whiteboard/recognize', async (req, res) => {
    try {
      const { imageBase64, languageHint = 'auto', context = '' } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'imageBase64 string is required' });
      }

      // Strip potential data URL prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      // Check cache to avoid repeating requests for identical strokes
      const hash = crypto.createHash('md5').update(cleanBase64.slice(0, 4000)).digest('hex');
      const cached = handwritingCache.get(hash);
      if (cached) {
        return res.json({ ...cached, cached: true });
      }

      // Check server cooldown if rate limit was recently encountered
      if (Date.now() < handwritingCooldownUntil) {
        const remainingSec = Math.ceil((handwritingCooldownUntil - Date.now()) / 1000);
        return res.json({
          success: false,
          fallback: true,
          rateLimited: true,
          message: `AI recognition cooling down (${remainingSec}s); original handwriting preserved.`,
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          fallback: true,
          error: 'NOT_CONFIGURED',
          message: 'Server GEMINI_API_KEY is not configured',
        });
      }

      let mimeType = 'image/jpeg';
      if (imageBase64.startsWith('data:image/png')) {
        mimeType = 'image/png';
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are the real-time AI handwriting recognition engine for SmartEducate, an international educational university whiteboard.
Analyze the provided handwritten whiteboard ink stroke image.
The instructor writes in English, Somali (standard Latin orthography), Arabic (RTL script), and/or Mathematics & scientific formulas/numbers.
Context: ${context || 'Classroom Whiteboard Lecture Notes'}
Language Hint: ${languageHint}

Instructions:
1. Accurately transcribe the handwritten word, phrase, sentence, or mathematical equation as coherent text.
2. If multiple lines of handwriting or equations are present, preserve natural line breaks using newline characters ("\\n") so lines are rendered on their respective baselines.
3. If it is Arabic, ensure correct connected letter forms, authentic spelling, and set isRTL to true.
4. If it is Somali, recognize correct Somali Latin vocabulary (e.g. Baro, Qor, Fasalka, Xisaab, Casharka, Sayniska) and set language to "so".
5. If it is Mathematics or a formula, transcribe using standard clean Unicode math characters (e.g. x² + y² = r², √x, a/b, ±, ∑, ∫, θ, π, ≤, ≥, ≠, =, +) and set isMath to true.
6. If the drawing is NOT text or math (e.g. random scribble, simple circle/box drawing, or unreadable ink), set confidence < 0.4.
7. Provide a confidence rating between 0.0 and 1.0.

Respond strictly in valid JSON format:
{
  "recognizedText": "exact recognized text, equation, or line(s)",
  "language": "en" | "so" | "ar" | "math" | "mixed",
  "isRTL": boolean,
  "isMath": boolean,
  "confidence": number
}`;

      // Recognition models tier: fast multimodal vision models
      const RECOGNITION_MODELS = [
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ];
      let aiResponse: any = null;
      let isRateLimitHit = false;
      let isHighDemandHit = false;

      for (const model of RECOGNITION_MODELS) {
        try {
          aiResponse = await ai.models.generateContent({
            model,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
            config: {
              responseMimeType: 'application/json',
            },
          });
          break;
        } catch (mErr: any) {
          const errMsg = mErr?.message || String(mErr || '');
          const isQuota =
            mErr?.status === 429 ||
            mErr?.status === 'RESOURCE_EXHAUSTED' ||
            errMsg.includes('429') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('quota');

          const isDemandSpike =
            mErr?.status === 503 ||
            mErr?.status === 'UNAVAILABLE' ||
            errMsg.includes('503') ||
            errMsg.includes('high demand') ||
            errMsg.includes('UNAVAILABLE');

          if (isQuota) {
            isRateLimitHit = true;
            const delayMatch = errMsg.match(/retry in\s+([0-9.]+)/i);
            const waitSec = delayMatch ? Math.ceil(parseFloat(delayMatch[1])) + 2 : 25;
            handwritingCooldownUntil = Date.now() + waitSec * 1000;
            break;
          } else if (isDemandSpike) {
            isHighDemandHit = true;
            handwritingCooldownUntil = Date.now() + 15000;
            // Gracefully try next model tier
          }
        }
      }

      if (!aiResponse) {
        return res.json({
          success: false,
          fallback: true,
          rateLimited: isRateLimitHit,
          busy: isHighDemandHit,
          message: isRateLimitHit
            ? 'AI recognition quota limit reached; preserving original handwriting strokes.'
            : isHighDemandHit
            ? 'AI model currently experiencing high demand; preserving original handwriting strokes.'
            : 'AI recognition busy; preserving original handwriting strokes.',
        });
      }

      const responseText = aiResponse.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      const recognizedText = String(parsed.recognizedText || '').trim();
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;

      if (!recognizedText || confidence < 0.45) {
        return res.json({
          success: false,
          fallback: true,
          message: 'Ambiguous handwriting or drawing detected, preserving original strokes.',
          confidence,
        });
      }

      const resultPayload = {
        success: true,
        recognizedText,
        language: parsed.language || 'en',
        isRTL: Boolean(parsed.isRTL),
        isMath: Boolean(parsed.isMath),
        confidence,
      };

      // Store in LRU cache
      if (handwritingCache.size >= 100) {
        const oldestKey = handwritingCache.keys().next().value;
        if (oldestKey) handwritingCache.delete(oldestKey);
      }
      handwritingCache.set(hash, resultPayload);

      return res.json(resultPayload);
    } catch (err: any) {
      return res.json({
        success: false,
        fallback: true,
        error: 'RECOGNITION_ERROR',
        message: 'Recognition service temporarily unavailable; original handwriting preserved.',
      });
    }
  });

  // =========================================================================
  // CANONICAL SERVER-SIDE EDUCATIONAL AI TEACHER ENDPOINT (STEP 06B)
  // Connects student & teacher educational inquiries directly to Google Gemini
  // with universal subject coverage and progressive academic level adaptation.
  // =========================================================================
  app.post('/api/ai/teacher', async (req, res) => {
    try {
      const {
        prompt,
        language = 'en',
        educationalContext = {},
        conversationHistory = [],
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_INPUT',
          message: 'A valid educational question or prompt is required.',
        });
      }

      const cleanPrompt = prompt.trim();
      if (cleanPrompt.length > 4000) {
        return res.status(400).json({
          success: false,
          error: 'PROMPT_TOO_LONG',
          message: 'Prompt exceeds maximum allowed length of 4000 characters.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: 'NOT_CONFIGURED',
          message: 'Server GEMINI_API_KEY is not configured.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Context resolution
      const targetLang = String(language || 'en').toLowerCase().split('-')[0];
      const langNames: Record<string, string> = {
        en: 'English',
        so: 'Somali (Af-Soomaali)',
        ar: 'Arabic (العربية)',
        fr: 'French',
        es: 'Spanish',
        sw: 'Swahili',
        tr: 'Turkish',
        de: 'German',
      };
      const langName = langNames[targetLang] || 'English';

      const level =
        educationalContext.level ||
        educationalContext.grade ||
        educationalContext.degreeLevel ||
        (educationalContext.currentYearOfStudy ? `Year ${educationalContext.currentYearOfStudy} University` : '') ||
        'Secondary (Grades 7–12)';
      const studentName = educationalContext.studentName || '';

      const systemInstruction = `You are SmartEducate AI Educational Teacher & Tutor, a world-class, encouraging, and pedagogically rigorous educator.

Core Directives:
1. Universal Subject Coverage:
   Answer legitimate educational inquiries across ALL academic disciplines and levels:
   - Languages & Linguistics: English grammar, vocabulary, reading comprehension, writing, spelling, punctuation, literary devices, literature, Somali language and grammar, Arabic language, and other world languages.
   - Mathematics: Arithmetic, algebra, geometry, trigonometry, calculus, linear algebra, discrete math, statistics, and proofs.
   - Natural Sciences: Physics, chemistry, biology, environmental science, earth science, and laboratory methods.
   - Humanities & Social Sciences: History, geography, civics, government, economics, sociology, philosophy, and psychology.
   - Technology & Computer Science: Programming, data structures, algorithms, web development, software engineering, and database systems.
   - Higher Education & Professional Skills: University-level theories, research methods, academic writing, business, accounting, finance, engineering, and career skills.
   - General Educational Support: Study techniques, critical thinking, conceptual analogies, and problem-solving strategies.

2. Academic Level Adaptation:
   Use the learner's specified academic level (${level}) to adapt explanation depth, vocabulary, and cognitive framing:
   - Primary (Grades 1–6): Intuitive, simple, warm explanations using concrete real-world analogies and foundational examples.
   - Secondary / Middle & High School (Grades 7–12): Standard curriculum rigor, clear formal definitions, step-by-step problem-solving, and practical applications.
   - University / Undergraduate: In-depth academic mechanics, formal notation, rigorous derivations, and theoretical context.
   - Postgraduate / Research / Masters: Advanced synthesis, epistemological nuance, methodological considerations, distinguishing established consensus from open research questions.
   - Professional Track: Industry-standard best practices, real-world implementations, and actionable solutions.

3. Subject Freedom:
   If the user asks a legitimate question outside their currently selected subject or course, ALWAYS answer it completely, helpfully, and accurately. Never refuse, deflect, or restrict answers merely because the current dashboard subject or grade selection differs.

4. Pedagogical Structure:
   When explaining a concept or solving a problem, structure your response clearly:
   - Clear definition or central answer
   - Step-by-step explanation or derivation
   - Concrete examples or helpful analogies
   - Brief practice question or check for understanding when appropriate

5. Language & Localization:
   - Respond fluently in the requested language: ${langName} (${targetLang}).
   - If Somali ("so"): Use authentic, clear Somali terminology and standard Latin orthography.
   - If Arabic ("ar"): Use standard formal Arabic (Fusha) with accurate pedagogical terms.
   - If English ("en"): Use clear, grammatically pristine English.

6. Integrity & Safety:
   - Be honest when there are multiple schools of thought or uncertainty. Never invent non-existent citations or false facts.
   - Maintain a supportive, respectful, inspiring tone.`;

      // Build contents array including validated conversation history if provided
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(conversationHistory)) {
        const recentHistory = conversationHistory.slice(-6);
        for (const item of recentHistory) {
          if (item && typeof item.text === 'string' && item.text.trim()) {
            const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
            contents.push({
              role,
              parts: [{ text: String(item.text).slice(0, 2000) }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: cleanPrompt }],
      });

      const AI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let modelResponse: any = null;
      let usedModel = AI_MODELS[0];
      let lastError: any = null;

      for (const model of AI_MODELS) {
        try {
          console.log(`[AI Teacher] Querying ${model} (lang: ${targetLang}, level: ${level})...`);
          modelResponse = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.4,
              maxOutputTokens: 2048,
            },
          });
          usedModel = model;
          break;
        } catch (mErr: any) {
          console.warn(`[AI Teacher] Model ${model} failed, trying fallback:`, mErr?.message || mErr);
          lastError = mErr;
          // Brief pause before trying fallback model
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
      }

      if (!modelResponse || !modelResponse.text) {
        const isUnavailable =
          lastError?.status === 503 ||
          /503|unavailable|high demand|overloaded/i.test(lastError?.message || '');
        const isRateLimit =
          lastError?.status === 429 ||
          /quota|rate limit|resource_exhausted/i.test(lastError?.message || '');

        if (isUnavailable || isRateLimit) {
          return res.status(503).json({
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message: 'AI Teacher service is currently experiencing high demand. Please try again in a few moments.',
          });
        }
        return res.status(500).json({
          success: false,
          error: 'PROVIDER_ERROR',
          message: lastError?.message || 'Unable to generate response from AI educational provider.',
        });
      }

      const rawText = String(modelResponse.text).trim();

      // Derive clean spoken text for voiceService.speak (stripping markdown syntax)
      const spokenText = rawText
        .replace(/```[\s\S]*?```/g, 'Code example provided in notes.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n{2,}/g, '\n\n')
        .trim();

      return res.json({
        success: true,
        text: rawText,
        spokenText,
        model: usedModel,
      });
    } catch (err: any) {
      console.error('[AI Teacher] Unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: err?.message || 'An unexpected server error occurred while processing the educational question.',
      });
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartEducate Full-Stack server running on port ${PORT}`);
  });
}

startServer();
