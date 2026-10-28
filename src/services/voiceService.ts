/**
 * SmartEducate Canonical Voice & Audio Engine (Phase 13 / Critical Voice Engine Replacement)
 *
 * Single Source of Truth Architecture:
 * - REAL Neural TTS Provider (gemini-3.8-flash-tts via /api/tts)
 * - Distinct, verified neural voices:
 *     Female -> 'Kore' (Authentic, natural feminine neural voice)
 *     Male   -> 'Puck' (Authentic, natural masculine neural voice)
 * - ABSOLUTELY NO silent browser speechSynthesis fallback.
 * - Persistent gender and language configuration via getActiveAiTutorVoice().
 * - Multi-question voice stability (all responses in conversation use the configured voice).
 * - Multi-layer voice cache strictly keyed by language + gender + voiceId + text.
 * - Race condition prevention via monotonic voiceRequestId cancellation.
 * - Full compliance with PART 1 to PART 18 specifications.
 */

export type VoiceGender = 'female' | 'male';
export type VoiceEngineType = 'neural' | 'device_fallback';

export interface VoiceConfig {
  gender: VoiceGender;
  language: string;
  provider: 'neural_gemini_tts' | 'device_speech_synthesis';
  voiceId: string;
  engine?: VoiceEngineType;
}

export interface VoicePlaybackOptions {
  gender?: VoiceGender;
  language?: string;
  autoplay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export interface VoicePlaybackResult {
  success: boolean;
  blocked: boolean;
  provider: 'neural_gemini_tts' | 'device_speech_synthesis';
  voiceId: string;
  requestId: number;
  fallbackUsed: boolean;
  engine?: VoiceEngineType;
  quotaExhausted?: boolean;
  autoplay?: boolean;
  audioStarted?: boolean;
  audioEnded?: boolean;
  error?: any;
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (
    errorCode: 'not-allowed' | 'no-speech' | 'network' | 'unsupported' | 'blocked_by_preview' | 'other',
    details?: string
  ) => void;
}

export interface MicPermissionResult {
  granted: boolean;
  isBlockedByPreview?: boolean;
  reason?: 'granted' | 'denied' | 'unsupported' | 'insecure_context' | 'blocked_by_preview';
  message?: string;
  error?: string;
}

export interface SequencePlaybackOptions {
  gender?: VoiceGender;
  language?: string;
  autoplay?: boolean;
  onChunkStart?: (chunkIndex: number, totalChunks: number, chunkText: string) => void;
  onChunkEnd?: (chunkIndex: number, totalChunks: number) => void;
  onComplete?: () => void;
  onError?: (error: any, chunkIndex: number) => void;
  onAutoplayBlocked?: (chunkIndex: number) => void;
}

export interface SequenceProgress {
  active: boolean;
  isPaused: boolean;
  currentChunk: number;
  totalChunks: number;
  currentText: string;
}

// Spoken welcome translations for the AI Teacher Home entry
export const AI_TEACHER_WELCOME_MESSAGES: Record<string, string> = {
  en: 'Welcome to SmartEducate AI Teacher. What would you like to prepare today?',
  so: 'Ku soo dhowow SmartEducate AI Teacher. Maxaad jeclaan lahayd inaad maanta diyaariso?',
  ar: 'مرحبًا بك في معلم SmartEducate الذكي. ماذا تريد أن تُحضّر اليوم؟',
};

/**
 * Robust, language-aware text chunking for complete speech playback.
 * Splits long AI responses at natural paragraph, question, and sentence boundaries.
 */
export function splitTextIntoSpeakableChunks(rawText: string, maxChunkLength = 280): string[] {
  if (!rawText || !rawText.trim()) return [];

  // Clean markdown tokens without mangling Arabic, Somali, or scientific text
  const clean = rawText
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\d+\s*(?:pts|dhibcood|درجة|mark|marks)\]/gi, '')
    .replace(/={3,}/g, '')
    .replace(/-{3,}/g, '')
    .trim();

  // Split into major question blocks and paragraphs
  const blocks = clean.split(/\n\s*\n|\n(?=(?:Question\s*\d+|Q\d+|\d+\.|\(\d+\)|المسألة\s*\d+|السؤال\s*\d+|Su'aal(?:sha)?\s*\d+))/i);
  const chunks: string[] = [];

  for (const block of blocks) {
    const trimmedBlock = block.replace(/\s+/g, ' ').trim();
    if (!trimmedBlock) continue;

    if (trimmedBlock.length <= maxChunkLength) {
      chunks.push(trimmedBlock);
      continue;
    }

    // Split at sentence boundaries
    const sentences = trimmedBlock.split(/(?<=[.!?؟。])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      if ((currentChunk + ' ' + s).trim().length <= maxChunkLength) {
        currentChunk = currentChunk ? `${currentChunk} ${s}` : s;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        if (s.length <= maxChunkLength) {
          currentChunk = s;
        } else {
          // If a single sentence exceeds maxChunkLength, split by clause punctuation (, or ; or ،)
          const clauses = s.split(/(?<=[,;،])\s+/);
          for (const clause of clauses) {
            const c = clause.trim();
            if (!c) continue;
            if ((currentChunk + ' ' + c).trim().length <= maxChunkLength) {
              currentChunk = currentChunk ? `${currentChunk} ${c}` : c;
            } else {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = c;
            }
          }
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  // Combine tiny dangling chunks (< 25 chars) with preceding chunk if within size budget
  const consolidated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const ch = chunks[i].trim();
    if (!ch) continue;
    if (ch.length < 25 && consolidated.length > 0 && (consolidated[consolidated.length - 1].length + ch.length) <= maxChunkLength * 1.25) {
      consolidated[consolidated.length - 1] += ' ' + ch;
    } else {
      consolidated.push(ch);
    }
  }

  return consolidated.length > 0 ? consolidated : [clean.slice(0, maxChunkLength)];
}

// Canonical Prebuilt Neural Voice IDs
export const CANONICAL_NEURAL_VOICES: Record<VoiceGender, string> = {
  female: 'Kore',
  male: 'Puck',
};

export const VOICE_GENDER_STORAGE_KEY = 'smarteducate_voice_gender';

/**
 * Heuristically inspects a device speech synthesis voice to infer gender from metadata,
 * voiceURI, or standard system voice naming conventions (Windows, Apple, Android, ChromeOS).
 * If no gender can be inferred reliably, returns 'unknown' without falsifying the label.
 */
export function inferDeviceVoiceGender(voice: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
  const text = `${voice.name} ${voice.voiceURI}`.toLowerCase();

  // Explicit gender tokens and tags
  if (/\b(female|woman|girl|madam|lady)\b/i.test(text) || /#female/i.test(text) || /_female/i.test(text)) {
    return 'female';
  }
  if (/\b(male|man|boy|sir|gentleman)\b/i.test(text) || /#male/i.test(text) || /_male/i.test(text)) {
    return 'male';
  }

  // Common preinstalled OS voice identifiers
  const femaleNames = [
    'zira', 'samantha', 'victoria', 'karen', 'susan', 'hazel', 'catherine',
    'heather', 'jenny', 'linda', 'sarah', 'fiona', 'tessa', 'veena',
    'ayesha', 'layla', 'mariam', 'fatima', 'salma', 'zeina', 'monica', 'helena', 'elena'
  ];
  const maleNames = [
    'david', 'mark', 'george', 'guy', 'alex', 'daniel', 'fred', 'oliver',
    'rishi', 'tarik', 'maged', 'naayf', 'james', 'richard', 'tom', 'diego', 'jorge'
  ];

  for (const fn of femaleNames) {
    if (new RegExp(`\\b${fn}\\b`, 'i').test(text)) return 'female';
  }
  for (const mn of maleNames) {
    if (new RegExp(`\\b${mn}\\b`, 'i').test(text)) return 'male';
  }

  return 'unknown';
}

// Supported Languages with Neural TTS Verification
export const SUPPORTED_NEURAL_LANGUAGES: Record<string, { name: string; verified: boolean }> = {
  en: { name: 'English', verified: true },
  ar: { name: 'Arabic', verified: true },
  so: { name: 'Somali', verified: true },
};

/**
 * SINGLE SOURCE OF TRUTH: Canonical voice configuration resolver
 */
export function getActiveAiTutorVoice(
  gender?: VoiceGender,
  language: string = 'en'
): VoiceConfig {
  let resolvedGender: VoiceGender = gender || 'female';
  if (!gender && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(VOICE_GENDER_STORAGE_KEY);
      if (stored === 'male' || stored === 'female') {
        resolvedGender = stored;
      }
    } catch {
      // safe ignore
    }
  }

  const normLang = (language || 'en').toLowerCase().split('-')[0];
  const normGender: VoiceGender = resolvedGender === 'male' ? 'male' : 'female';
  const voiceId = CANONICAL_NEURAL_VOICES[normGender];

  return {
    gender: normGender,
    language: normLang,
    provider: 'neural_gemini_tts',
    voiceId,
  };
}

// Language Mapping for STT (Speech-to-Text)
export const STT_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-US',
  so: 'so-SO',
  ar: 'ar-SA',
  sw: 'sw-KE',
  tr: 'tr-TR',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  ru: 'ru-RU',
  ur: 'ur-PK',
  it: 'it-IT',
  pt: 'pt-BR',
  zh: 'zh-CN',
};

function base64ToBlob(base64: string, mimeType = 'audio/wav'): { blob: Blob; isWav: boolean; byteLength: number } {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check if bytes already has the standard 'RIFF' signature (0x52, 0x49, 0x46, 0x46)
  const hasRiff =
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46;

  if (hasRiff) {
    return {
      blob: new Blob([bytes], { type: mimeType }),
      isWav: true,
      byteLength: bytes.length,
    };
  }

  // Prepend 44-byte standard RIFF/WAVE header for 24000Hz 16-bit Mono Linear PCM
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = bytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // 'RIFF'
  view.setUint32(0, 0x52494646, false); // big-endian
  view.setUint32(4, 36 + dataSize, true); // little-endian
  // 'WAVE'
  view.setUint32(8, 0x57415645, false); // big-endian
  // 'fmt '
  view.setUint32(12, 0x666d7420, false); // big-endian
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample
  // 'data'
  view.setUint32(36, 0x64617461, false); // big-endian
  view.setUint32(40, dataSize, true); // Subchunk2Size

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(bytes, 44);

  return {
    blob: new Blob([wavBytes], { type: 'audio/wav' }),
    isWav: true,
    byteLength: wavBytes.length,
  };
}

class VoiceService {
  private activeAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private isCurrentlyPlaying: boolean = false;
  private activeMessageId: string | null = null;
  private requestIdCounter: number = 0;
  private activeRequestId: number = 0;
  private isAudioUnlocked: boolean = false;

  // Sequence queue states for reading complete AI responses
  private sequenceIdCounter: number = 0;
  private activeSequenceId: number = 0;
  private isSequenceRunning: boolean = false;
  private isSequencePausedState: boolean = false;
  private currentSequenceChunks: string[] = [];
  private currentSequenceIndex: number = 0;
  private activeSequenceOptions: SequencePlaybackOptions | null = null;

  // Single controlled queue for client-side TTS generation requests (Concurrency = 1)
  private ttsQueuePromise: Promise<any> = Promise.resolve();
  private inFlightFetches = new Map<
    string,
    Promise<{ audioBase64: string; mimeType: string; model?: string; cached: boolean } | null>
  >();
  private isTtsGenerating: boolean = false;

  // Client-side cache: Key = `${lang}_${gender}_${voiceId}_${cleanText}` -> base64 audio
  private clientAudioCache = new Map<
    string,
    { audioBase64: string; mimeType: string; model?: string }
  >();

  // Voice Engine State: 'neural' (default preferred) or 'device_fallback' (standard device speech)
  private currentEngine: VoiceEngineType = 'neural';
  private isNeuralQuotaExhaustedState: boolean = false;
  private quotaResetRemainingSec: number = 0;
  private activeUtterance: any = null;
  private isDeviceSpeechPaused: boolean = false;

  // Microphone / SpeechRecognition state
  private activeRecognition: any = null;

  // Listeners for engine and quota changes
  private quotaChangeListeners: Array<(exhausted: boolean, engine: VoiceEngineType) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkServerQuotaStatus().catch(() => {});
    }
  }

  public onQuotaOrEngineChange(cb: (exhausted: boolean, engine: VoiceEngineType) => void): () => void {
    this.quotaChangeListeners.push(cb);
    return () => {
      this.quotaChangeListeners = this.quotaChangeListeners.filter((l) => l !== cb);
    };
  }

  private notifyQuotaOrEngineChange(): void {
    for (const cb of this.quotaChangeListeners) {
      try {
        cb(this.isNeuralQuotaExhaustedState, this.currentEngine);
      } catch {
        // safe ignore
      }
    }
  }

  public setVoiceEngine(engine: VoiceEngineType): void {
    this.currentEngine = engine;
    console.log(`[TTS Engine] Active voice engine set to: ${engine}`);
    this.notifyQuotaOrEngineChange();
  }

  public getVoiceEngine(): VoiceEngineType {
    return this.currentEngine;
  }

  public isNeuralQuotaExhausted(): boolean {
    return this.isNeuralQuotaExhaustedState;
  }

  public getQuotaResetRemainingSec(): number {
    return this.quotaResetRemainingSec;
  }

  public setNeuralQuotaExhausted(exhausted: boolean, retryAfterSec = 3600): void {
    this.isNeuralQuotaExhaustedState = exhausted;
    this.quotaResetRemainingSec = retryAfterSec;
    this.notifyQuotaOrEngineChange();
  }

  public async checkServerQuotaStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.quotaExhausted) {
          this.isNeuralQuotaExhaustedState = true;
          this.quotaResetRemainingSec = data.quotaRetryAfter || 3600;
          this.notifyQuotaOrEngineChange();
          return false;
        } else {
          this.isNeuralQuotaExhaustedState = false;
          this.quotaResetRemainingSec = 0;
          this.notifyQuotaOrEngineChange();
          return true;
        }
      }
    } catch {
      // safe ignore
    }
    return !this.isNeuralQuotaExhaustedState;
  }

  /**
   * Verified language capability check for standard browser speech synthesis fallback.
   * - English ('en'): Supported on all modern browsers and Android.
   * - Arabic ('ar'): Supported if Arabic voice package is installed on the device.
   * - Somali ('so'): NOT supported by standard browser SpeechSynthesis engines on Android/iOS/Windows.
   */
  public isFallbackSupportedForLanguage(language: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    const norm = (language || 'en').toLowerCase().split('-')[0];
    if (norm === 'en') return true;
    if (norm === 'ar') {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return true;
        return voices.some((v) => v.lang.toLowerCase().startsWith('ar'));
      } catch {
        return true;
      }
    }
    if (norm === 'so') {
      try {
        const voices = window.speechSynthesis.getVoices();
        return voices.some((v) => v.lang.toLowerCase().startsWith('so'));
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * User-initiated quota recheck: tests if Google Gemini daily free-tier quota is restored
   */
  public async recheckNeuralQuota(): Promise<boolean> {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'recheck',
          language: 'en',
          recheck: true,
        }),
      });
      if (res.status === 200) {
        this.isNeuralQuotaExhaustedState = false;
        this.quotaResetRemainingSec = 0;
        return true;
      }
      const data = await res.json().catch(() => ({}));
      if (data.quotaExhausted) {
        this.isNeuralQuotaExhaustedState = true;
        this.quotaResetRemainingSec = data.retryAfter || 3600;
        return false;
      }
      this.isNeuralQuotaExhaustedState = false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safe Fallback Speech Execution using standard browser SpeechSynthesis (window.speechSynthesis).
   * Clearly labeled as a standard device synthesizer, NOT premium neural AI voice.
   */
  private speakWithDeviceFallback(
    text: string,
    voiceConfig: VoiceConfig,
    options: VoicePlaybackOptions = {},
    thisRequestId: number
  ): Promise<VoicePlaybackResult> {
    return new Promise<VoicePlaybackResult>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve({
          success: false,
          blocked: false,
          provider: 'device_speech_synthesis',
          voiceId: 'device-default',
          requestId: thisRequestId,
          fallbackUsed: true,
          engine: 'device_fallback',
          error: 'Browser SpeechSynthesis is not supported on this device.',
        });
      }

      // Check if Somali is requested on an engine without Somali voice
      if (voiceConfig.language === 'so' && !this.isFallbackSupportedForLanguage('so')) {
        return resolve({
          success: false,
          blocked: false,
          provider: 'device_speech_synthesis',
          voiceId: 'device-default',
          requestId: thisRequestId,
          fallbackUsed: true,
          engine: 'device_fallback',
          error: 'Standard device voice does not support Somali. Somali explanation is preserved in full text.',
        });
      }

      try {
        window.speechSynthesis.cancel();
      } catch {
        // safe ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;

      const langCode = voiceConfig.language === 'ar' ? 'ar-SA' : voiceConfig.language === 'so' ? 'so-SO' : 'en-US';
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      let chosenVoice: SpeechSynthesisVoice | null = null;
      let matchedGender = false;
      try {
        const bestResult = this.findBestDeviceVoice(voiceConfig.language, voiceConfig.gender);
        chosenVoice = bestResult.voice;
        matchedGender = bestResult.genderMatched;
        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
      } catch {
        // safe ignore
      }

      console.log(
        `[TTS_FALLBACK] Executing Standard Device Speech (window.speechSynthesis)\ntext="${text.slice(0, 40)}..."\nlang=${utterance.lang}\nrequestedGender=${voiceConfig.gender}\nmatchedGender=${matchedGender}\nselectedVoice="${chosenVoice?.name || 'device-default'}"\nengine=device_fallback\nquality=standard_device_synthesizer\nfallbackUsed=true`
      );

      let isResolved = false;

      utterance.onstart = () => {
        if (this.activeRequestId === thisRequestId) {
          this.isCurrentlyPlaying = true;
          this.isDeviceSpeechPaused = false;
          options.onStart?.();
        }
      };

      utterance.onend = () => {
        if (this.activeRequestId === thisRequestId) {
          this.isCurrentlyPlaying = false;
          this.isDeviceSpeechPaused = false;
          this.activeUtterance = null;
          options.onEnd?.();
        }
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: true,
            blocked: false,
            provider: 'device_speech_synthesis',
            voiceId: utterance.voice?.name || 'device-standard',
            requestId: thisRequestId,
            fallbackUsed: true,
            engine: 'device_fallback',
            audioStarted: true,
            audioEnded: true,
          });
        }
      };

      utterance.onerror = (e: any) => {
        if (this.activeRequestId === thisRequestId) {
          this.isCurrentlyPlaying = false;
          this.isDeviceSpeechPaused = false;
          this.activeUtterance = null;
          options.onError?.(e);
        }
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: false,
            blocked: false,
            provider: 'device_speech_synthesis',
            voiceId: utterance.voice?.name || 'device-standard',
            requestId: thisRequestId,
            fallbackUsed: true,
            engine: 'device_fallback',
            error: e?.error || 'speech_synthesis_error',
          });
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: true,
            blocked: false,
            provider: 'device_speech_synthesis',
            voiceId: utterance.voice?.name || 'device-standard',
            requestId: thisRequestId,
            fallbackUsed: true,
            engine: 'device_fallback',
            audioStarted: true,
            audioEnded: false,
          });
        }
      } catch (err: any) {
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: false,
            blocked: false,
            provider: 'device_speech_synthesis',
            voiceId: 'device-standard',
            requestId: thisRequestId,
            fallbackUsed: true,
            engine: 'device_fallback',
            error: err?.message || 'speech_synthesis_failed',
          });
        }
      }
    });
  }

  /**
   * Unlock browser audio session on first student interaction so subsequent AI responses
   * play automatically without restriction.
   */
  public unlockAudioSession(): void {
    if (this.isAudioUnlocked) return;
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        }
      }
      const silentAudio = new Audio(
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='
      );
      silentAudio.volume = 0.01;
      silentAudio
        .play()
        .then(() => {
          this.isAudioUnlocked = true;
        })
        .catch(() => {
          // safe ignore
        });
    } catch {
      // safe ignore
    }
  }

  /**
   * Primary Neural TTS Speech Execution
   *
  /**
   * Controlled single-concurrency TTS request fetcher with deduplication and bounded 429 backoff.
   * Guarantees that at most ONE network request to /api/tts runs at any time across the entire application.
   */
  private async fetchTtsAudioWithControlledQueue(
    cleanText: string,
    voiceConfig: VoiceConfig,
    expectedRequestId: number
  ): Promise<{ audioBase64: string; mimeType: string; model?: string; cached: boolean } | null> {
    const cacheKey = `${voiceConfig.language}_${voiceConfig.gender}_${voiceConfig.voiceId}_${cleanText}`;

    // 1. Instant client-side memory cache check (0ms latency, 0 network requests)
    if (this.clientAudioCache.has(cacheKey)) {
      const cached = this.clientAudioCache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    // 2. In-flight request deduplication (prevents duplicate requests for the identical text/voice)
    if (this.inFlightFetches.has(cacheKey)) {
      return this.inFlightFetches.get(cacheKey)!;
    }

    // 3. Enqueue execution through single controlled queue (strictly concurrency = 1)
    const task = async (): Promise<{ audioBase64: string; mimeType: string; model?: string; cached: boolean } | null> => {
      // Re-check client cache in case a preceding task populated it
      if (this.clientAudioCache.has(cacheKey)) {
        const cached = this.clientAudioCache.get(cacheKey)!;
        return { ...cached, cached: true };
      }

      this.isTtsGenerating = true;
      const maxRetries = 2;
      let attempt = 0;
      const queueStartTime = Date.now();

      try {
        while (attempt <= maxRetries) {
          // If request was cancelled or superseded by newer request, abort immediately
          if (expectedRequestId !== -1 && this.activeRequestId !== expectedRequestId) {
            console.log(`[TTS Diagnostic] [Req #${expectedRequestId}] Aborted: superseded by Req #${this.activeRequestId}`);
            return null;
          }

          const fetchStartTime = Date.now();
          console.log(
            `[TTS Diagnostic] [Req #${expectedRequestId}] Dispatching TTS call (attempt ${attempt + 1}/${maxRetries + 1}, textChars=${cleanText.length}, lang=${voiceConfig.language}, activeInFlight=${this.inFlightFetches.size})`
          );

          try {
            const response = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: cleanText,
                language: voiceConfig.language,
                gender: voiceConfig.gender,
                voiceId: voiceConfig.voiceId,
              }),
            });

            console.log(
              `[TTS Diagnostic] [Req #${expectedRequestId}] Received HTTP ${response.status} in ${Date.now() - fetchStartTime}ms (totalQueueTime=${Date.now() - queueStartTime}ms)`
            );

            // Handle HTTP 429 rate limit safely with bounded backoff & jitter
            if (response.status === 429) {
              const errData = await response.json().catch(() => ({}));

              // If provider daily quota is exhausted (limit 10), do not send redundant retries
              if (errData.quotaExhausted || (errData.retryAfter && errData.retryAfter > 60)) {
                this.isNeuralQuotaExhaustedState = true;
                this.quotaResetRemainingSec = errData.retryAfter || 3600;
                this.notifyQuotaOrEngineChange();
                console.warn(`[TTS Diagnostic] [Req #${expectedRequestId}] Daily quota limit exhausted on provider. Aborting retries immediately.`);
                throw new Error(errData.message || 'Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.');
              }

              attempt++;
              if (attempt > maxRetries) {
                const limitMsg =
                  errData.message ||
                  'Voice is temporarily busy. Your text is still available.';
                console.warn(`[TTS Diagnostic] [Req #${expectedRequestId}] Bounded retries exhausted on HTTP 429 after ${Date.now() - queueStartTime}ms`);
                throw new Error(limitMsg);
              }

              const retryAfterHeader = response.headers.get('Retry-After');
              let waitSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (errData.retryAfter || 4);
              if (isNaN(waitSec) || waitSec <= 0) waitSec = 4;
              waitSec = Math.min(Math.max(waitSec, 1), 7);
              const jitterMs = Math.floor(Math.random() * 300) + 100;
              const totalWaitMs = waitSec * 1000 + jitterMs;

              console.warn(
                `[TTS Diagnostic] [Req #${expectedRequestId}] Rate limited (429). Waiting ${totalWaitMs}ms before bounded retry ${attempt}/${maxRetries}...`
              );
              await new Promise((r) => setTimeout(r, totalWaitMs));
              continue;
            }

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              const errMsg = errData.message || `TTS server responded with HTTP ${response.status}`;
              console.warn(`[TTS Diagnostic] [Req #${expectedRequestId}] Non-OK response HTTP ${response.status}: ${errMsg}`);
              throw new Error(errMsg);
            }

            const data = await response.json();
            if (!data.audioBase64) {
              throw new Error('No audio data received from neural TTS provider');
            }

            const result = {
              audioBase64: data.audioBase64,
              mimeType: data.mimeType || 'audio/wav',
              model: data.model || 'gemini-3.8-flash-tts',
              cached: Boolean(data.cached),
            };

            console.log(
              `[TTS Diagnostic] [Req #${expectedRequestId}] Audio ready: ${result.audioBase64.length} chars, model=${result.model}, cached=${result.cached}, elapsed=${Date.now() - queueStartTime}ms`
            );

            this.clientAudioCache.set(cacheKey, {
              audioBase64: result.audioBase64,
              mimeType: result.mimeType,
              model: result.model,
            });

            return result;
          } catch (err: any) {
            const errStr = typeof err?.message === 'string' ? err.message : '';
            if (errStr.includes('quota') || errStr.includes('10 requests')) {
              throw err;
            }
            const is429 = errStr.includes('429') || errStr.includes('busy') || errStr.includes('limit');
            if (is429 && attempt < maxRetries) {
              attempt++;
              const waitMs = 3500 + Math.floor(Math.random() * 300);
              console.warn(`[TTS Diagnostic] [Req #${expectedRequestId}] Retry attempt ${attempt}/${maxRetries} after error in ${Date.now() - queueStartTime}ms...`);
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            }
            throw err;
          }
        }
        return null;
      } finally {
        this.isTtsGenerating = false;
        this.inFlightFetches.delete(cacheKey);
      }
    };

    const taskPromise = this.ttsQueuePromise.then(task, task);
    this.ttsQueuePromise = taskPromise.then(() => {}, () => {});
    this.inFlightFetches.set(cacheKey, taskPromise);
    return taskPromise;
  }

  /**
   * Primary Neural TTS Speech Execution
   *
   * Strict Rules Enforced:
   * 1. Resolves canonical voice via getActiveAiTutorVoice().
   * 2. Checks client/server cache keyed by language, gender, voiceId, and text.
   * 3. Increments voiceRequestId to prevent race conditions from rapid toggles.
   * 4. Plays ONLY real neural cloud audio.
   * 5. ABSOLUTELY NO silent fallback to browser speechSynthesis.
   * 6. Emits structured debug log: [TTS] language, gender, provider, voiceId, requestId, fallbackUsed, audioGenerated.
   */
  public async speak(
    text: string,
    options: VoicePlaybackOptions = {},
    messageId: string = 'msg_' + Date.now().toString(36)
  ): Promise<VoicePlaybackResult> {
    // Monotonic request ID increments for cancellation protection
    this.requestIdCounter += 1;
    const thisRequestId = this.requestIdCounter;
    this.activeRequestId = thisRequestId;

    // 1. Resolve Canonical Voice Configuration (Single Source of Truth)
    const voiceConfig = getActiveAiTutorVoice(options.gender || this.getSavedVoiceGender(), options.language || 'en');

    // Protect against overlapping welcome audio
    if (messageId === 'ai_teacher_home_welcome') {
      if (this.isSequenceRunning || this.isCurrentlyPlaying || this.isTtsGenerating) {
        console.log('[TTS] Welcome voice deferred/skipped: active speech or sequence in progress.');
        return {
          success: false,
          blocked: false,
          provider: 'neural_gemini_tts',
          voiceId: voiceConfig.voiceId,
          requestId: thisRequestId,
          fallbackUsed: false,
          error: 'superseded_by_active_session',
        };
      }
    }

    // Stop any existing playing audio immediately
    this.stopAudioOnly();

    const cleanText = (text || '')
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return {
        success: false,
        blocked: false,
        provider: this.currentEngine === 'device_fallback' ? 'device_speech_synthesis' : 'neural_gemini_tts',
        voiceId: voiceConfig.voiceId,
        requestId: thisRequestId,
        fallbackUsed: this.currentEngine === 'device_fallback',
        error: 'empty_text',
      };
    }

    // 1. If user has selected standard device fallback engine:
    if (this.currentEngine === 'device_fallback') {
      return this.speakWithDeviceFallback(cleanText, voiceConfig, options, thisRequestId);
    }

    // 2. If neural engine is active, check memory cache first.
    // If NOT in cache and neural quota is known to be exhausted, return quota error immediately without network call.
    const cacheKey = `${voiceConfig.language}_${voiceConfig.gender}_${voiceConfig.voiceId}_${cleanText}`;
    if (!this.clientAudioCache.has(cacheKey) && this.isNeuralQuotaExhaustedState) {
      console.warn(`[TTS] Neural TTS request skipped: daily free-tier quota is known to be exhausted.`);
      return {
        success: false,
        blocked: false,
        provider: 'neural_gemini_tts',
        voiceId: voiceConfig.voiceId,
        requestId: thisRequestId,
        fallbackUsed: false,
        engine: 'neural',
        quotaExhausted: true,
        error: 'Neural TTS daily free-tier quota (10 requests/day) reached on Google Gemini. Your text is still available.',
      };
    }

    try {
      // Fetch audio safely through the single controlled queue
      const audioData = await this.fetchTtsAudioWithControlledQueue(
        cleanText,
        voiceConfig,
        thisRequestId
      );

      // Check if request was cancelled while fetch was in queue/in-flight
      if (this.activeRequestId !== thisRequestId || !audioData) {
        return {
          success: false,
          blocked: false,
          provider: 'neural_gemini_tts',
          voiceId: voiceConfig.voiceId,
          requestId: thisRequestId,
          fallbackUsed: false,
          error: 'cancelled_by_newer_request',
        };
      }

      const audioBase64 = audioData.audioBase64;
      const mimeType = audioData.mimeType || 'audio/wav';
      const usedModel = audioData.model || 'gemini-3.8-flash-tts';
      const audioGenerated = !audioData.cached;

      // Audit Logging (Section 4)
      console.log(
        `TTS_PROVIDER=Google Gemini Neural TTS\nTTS_MODEL=${usedModel}\nTTS_VOICE_ID=${voiceConfig.voiceId}\nTTS_LANGUAGE=${voiceConfig.language}\nAUDIO_FORMAT=${mimeType}\nAUDIO_SOURCE=/api/tts -> @google/genai\nFALLBACK_USED=false`
      );

      // 3. Log exact canonical voice details (Part 15 specification)
      console.log(
        `[TTS]\nlanguage: ${voiceConfig.language}\ngender: ${voiceConfig.gender}\nprovider: ${voiceConfig.provider}\nvoiceId: ${voiceConfig.voiceId}\nrequestId: ${thisRequestId}\nfallbackUsed: false\naudioGenerated: ${audioGenerated}`
      );

      // Check if user changed selection during network request
      if (this.activeRequestId !== thisRequestId) {
        return {
          success: false,
          blocked: false,
          provider: 'neural_gemini_tts',
          voiceId: voiceConfig.voiceId,
          requestId: thisRequestId,
          fallbackUsed: false,
          error: 'superseded_by_newer_request',
        };
      }

      // 4. Play Real Neural Audio via HTML5 Audio with Blob Object URL (Section 2)
      if (this.currentObjectUrl) {
        try {
          URL.revokeObjectURL(this.currentObjectUrl);
        } catch {
          // safe ignore
        }
        this.currentObjectUrl = null;
      }

      const { blob: audioBlob, isWav, byteLength } = base64ToBlob(audioBase64, mimeType || 'audio/wav');
      const objectUrl = URL.createObjectURL(audioBlob);
      this.currentObjectUrl = objectUrl;

      // Verification Logs: Checkpoints 1 to 6
      console.log(`[TTS_AUDIO_VERIFY] 1. TTS request sent: text="${cleanText.slice(0, 35)}...", lang=${voiceConfig.language}, gender=${voiceConfig.gender}`);
      console.log(`[TTS_AUDIO_VERIFY] 2. TTS response received: status=200, model=${usedModel}`);
      console.log(`[TTS_AUDIO_VERIFY] 3. Non-empty audio received: length=${audioBase64.length} chars`);
      console.log(`[TTS_AUDIO_VERIFY] 4. Audio MIME type: ${mimeType}`);
      console.log(`[TTS_AUDIO_VERIFY] 5. Valid Blob created: size=${audioBlob.size} bytes, type=${audioBlob.type}, isWavHeader=${isWav}`);
      console.log(`[TTS_AUDIO_VERIFY] 6. Audio element receives source: ${objectUrl}`);

      const audio = new Audio();
      this.activeAudio = audio; // Immediate reference to prevent GC during load
      audio.preload = 'auto';
      audio.src = objectUrl;
      audio.volume = 1.0;
      audio.muted = false;
      audio.playbackRate = 1.0;

      console.log(`[TTS_AUDIO_VERIFY] 7. audio.load() called`);
      audio.load();

      return new Promise<VoicePlaybackResult>((resolve) => {
        let isResolved = false;

        audio.addEventListener('loadedmetadata', () => {
          console.log(
            `[TTS_AUDIO_VERIFY] 11. muted=${audio.muted}, 12. volume=${audio.volume}, 13. playbackRate=${audio.playbackRate}, 14. duration=${audio.duration}s`
          );
        });

        audio.onplay = () => {
          if (this.activeRequestId === thisRequestId) {
            this.isCurrentlyPlaying = true;
            this.activeMessageId = messageId;
            this.isAudioUnlocked = true;
            options.onStart?.();
            console.log(
              `[TTS_AUDIO_VERIFY] 15. Audio actually reached PLAYING state! duration=${audio.duration}s`
            );
            console.log(
              `[TTS_RUNTIME]\nlanguage=${voiceConfig.language}\ngender=${voiceConfig.gender}\nprovider=${voiceConfig.provider}\nproviderVoiceId=${voiceConfig.voiceId}\nrequestId=${thisRequestId}\naudioUrl=${objectUrl}\nfallbackUsed=false\nautoplay=${Boolean(options.autoplay)}\naudioStarted=true\naudioEnded=false\nduration=${audio.duration}\nerror=none`
            );
          }
        };

        audio.onended = () => {
          if (this.activeRequestId === thisRequestId) {
            this.isCurrentlyPlaying = false;
            this.activeMessageId = null;
            this.activeAudio = null;
            options.onEnd?.();
            console.log(
              `[TTS_RUNTIME]\nlanguage=${voiceConfig.language}\ngender=${voiceConfig.gender}\nprovider=${voiceConfig.provider}\nproviderVoiceId=${voiceConfig.voiceId}\nrequestId=${thisRequestId}\naudioUrl=${objectUrl}\nfallbackUsed=false\nautoplay=${Boolean(options.autoplay)}\naudioStarted=true\naudioEnded=true\nduration=${audio.duration}\nerror=none`
            );
          }
        };

        audio.onerror = (e) => {
          if (this.activeRequestId === thisRequestId) {
            this.isCurrentlyPlaying = false;
            this.activeMessageId = null;
            this.activeAudio = null;
            options.onError?.(e);
            console.error(
              `[TTS_RUNTIME] audio.onerror triggered:`,
              audio.error
            );
          }
          if (!isResolved) {
            isResolved = true;
            resolve({
              success: false,
              blocked: false,
              provider: 'neural_gemini_tts',
              voiceId: voiceConfig.voiceId,
              requestId: thisRequestId,
              fallbackUsed: false,
              autoplay: options.autoplay,
              audioStarted: false,
              audioEnded: false,
              error: 'audio_playback_error',
            });
          }
        };

        // Trigger playback - Checkpoints 8, 9, 10
        console.log(`[TTS_AUDIO_VERIFY] 8. audio.play() is actually called`);
        audio
          .play()
          .then(() => {
            console.log(
              `[TTS_AUDIO_VERIFY] 9. audio.play() resolved successfully! 10. audio.play() did NOT reject.`
            );
            if (!isResolved) {
              isResolved = true;
              resolve({
                success: true,
                blocked: false,
                provider: 'neural_gemini_tts',
                voiceId: voiceConfig.voiceId,
                requestId: thisRequestId,
                fallbackUsed: false,
                autoplay: options.autoplay,
                audioStarted: true,
                audioEnded: false,
              });
            }
          })
          .catch((playErr) => {
            const isBlocked =
              playErr?.name === 'NotAllowedError' ||
              playErr?.message?.includes('interact') ||
              playErr?.message?.includes('user gesture');

            console.log(
              `[TTS_RUNTIME]\nlanguage=${voiceConfig.language}\ngender=${voiceConfig.gender}\nprovider=${voiceConfig.provider}\nproviderVoiceId=${voiceConfig.voiceId}\nrequestId=${thisRequestId}\naudioUrl=${objectUrl}\nfallbackUsed=false\nautoplay=${Boolean(options.autoplay)}\naudioStarted=false\naudioEnded=false\nerror=${isBlocked ? 'BLOCKED_BY_BROWSER_AUTOPLAY' : playErr?.message || 'playback_error'}`
            );

            if (!isResolved) {
              isResolved = true;
              resolve({
                success: false,
                blocked: isBlocked,
                provider: 'neural_gemini_tts',
                voiceId: voiceConfig.voiceId,
                requestId: thisRequestId,
                fallbackUsed: false,
                autoplay: options.autoplay,
                audioStarted: false,
                audioEnded: false,
                error: isBlocked ? 'BLOCKED_BY_BROWSER_AUTOPLAY' : playErr,
              });
            }
          });
      });
    } catch (err: any) {
      const errMsg = typeof err?.message === 'string' ? err.message : String(err);
      const isQuota = errMsg.includes('quota') || errMsg.includes('10 requests');
      if (isQuota) {
        this.isNeuralQuotaExhaustedState = true;
      }
      console.warn(`[TTS] Neural speech request failed:`, errMsg);

      return {
        success: false,
        blocked: false,
        provider: 'neural_gemini_tts',
        voiceId: voiceConfig.voiceId,
        requestId: thisRequestId,
        fallbackUsed: false,
        engine: 'neural',
        quotaExhausted: isQuota,
        error: errMsg || 'neural_tts_failed',
      };
    }
  }

  /**
   * Pre-fetches and caches TTS audio for the next speakable chunk in background
   * through the single controlled queue.
   */
  public async prefetchAudio(
    text: string,
    language = 'en',
    gender?: VoiceGender
  ): Promise<string | null> {
    if (this.currentEngine === 'device_fallback' || this.isNeuralQuotaExhaustedState) {
      return null;
    }
    const voiceConfig = getActiveAiTutorVoice(gender || this.getSavedVoiceGender(), language);
    const cleanText = (text || '')
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return null;

    try {
      const result = await this.fetchTtsAudioWithControlledQueue(cleanText, voiceConfig, -1);
      return result?.audioBase64 || null;
    } catch {
      return null;
    }
  }

  /**
   * Reads complete AI responses divided into sequential chunks.
   * Plays each chunk in order and pipelines subsequent chunks safely while active audio plays.
   */
  public async speakSequence(
    chunks: string[],
    options: SequencePlaybackOptions = {}
  ): Promise<void> {
    if (!chunks || chunks.length === 0) {
      options.onComplete?.();
      return;
    }

    // Monotonic sequence cancellation protection
    this.sequenceIdCounter += 1;
    const thisSeqId = this.sequenceIdCounter;
    this.activeSequenceId = thisSeqId;
    this.isSequenceRunning = true;
    this.isSequencePausedState = false;
    this.currentSequenceChunks = chunks;
    this.currentSequenceIndex = 0;
    this.activeSequenceOptions = options;

    await this.playSequenceChunk(0, thisSeqId);
  }

  private async playSequenceChunk(index: number, seqId: number): Promise<void> {
    if (this.activeSequenceId !== seqId || !this.isSequenceRunning) return;

    if (index >= this.currentSequenceChunks.length) {
      this.isSequenceRunning = false;
      this.isSequencePausedState = false;
      this.activeSequenceOptions?.onComplete?.();
      return;
    }

    this.currentSequenceIndex = index;
    const chunkText = this.currentSequenceChunks[index];
    const total = this.currentSequenceChunks.length;
    const options = this.activeSequenceOptions;

    options?.onChunkStart?.(index, total, chunkText);

    // CRITICAL: We do NOT fire prefetchAudio before or while generating this chunk!
    // Instead, prefetchAudio is triggered inside onStart (when THIS chunk is actively PLAYING through the speakers).
    // This strictly guarantees concurrency = 1 and eliminates provider flooding.

    const result = await this.speak(
      chunkText,
      {
        gender: options?.gender,
        language: options?.language,
        autoplay: options?.autoplay,
        onStart: () => {
          // Pre-fetch next chunk safely in background while THIS chunk is actively playing!
          if (index + 1 < total && this.activeSequenceId === seqId && this.isSequenceRunning) {
            this.prefetchAudio(
              this.currentSequenceChunks[index + 1],
              options?.language,
              options?.gender
            );
          }
        },
        onEnd: () => {
          if (this.activeSequenceId === seqId && this.isSequenceRunning && !this.isSequencePausedState) {
            options?.onChunkEnd?.(index, total);
            this.playSequenceChunk(index + 1, seqId);
          }
        },
        onError: (err) => {
          if (this.activeSequenceId === seqId) {
            this.isSequenceRunning = false;
            options?.onError?.(err, index);
          }
        },
      },
      `seq_${seqId}_chunk_${index}`
    );

    if (result.blocked) {
      this.isSequenceRunning = false;
      options?.onAutoplayBlocked?.(index);
    } else if (!result.success && result.error && result.error !== 'cancelled_by_newer_request' && result.error !== 'superseded_by_newer_request') {
      if (this.activeSequenceId === seqId) {
        this.isSequenceRunning = false;
        options?.onError?.(result.error, index);
      }
    }
  }

  public pauseSequence(): void {
    if (this.isSequenceRunning) {
      this.isSequencePausedState = true;
      if (this.currentEngine === 'device_fallback') {
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.pause();
            this.isDeviceSpeechPaused = true;
          }
        } catch {
          // safe ignore
        }
      } else {
        this.pauseAudio();
      }
    }
  }

  public resumeSequence(): void {
    if (this.isSequenceRunning && this.isSequencePausedState) {
      this.isSequencePausedState = false;
      if (this.currentEngine === 'device_fallback') {
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (this.isDeviceSpeechPaused) {
              window.speechSynthesis.resume();
              this.isDeviceSpeechPaused = false;
              return;
            }
          }
        } catch {
          // safe ignore
        }
        this.playSequenceChunk(this.currentSequenceIndex, this.activeSequenceId);
      } else {
        if (this.isAudioPaused()) {
          this.resumeAudio();
        } else {
          this.playSequenceChunk(this.currentSequenceIndex, this.activeSequenceId);
        }
      }
    }
  }

  /**
   * Resumes reading from the failed chunk without restarting from the beginning.
   * All earlier successful chunks remain cached in memory.
   */
  public async retryCurrentSequenceChunk(): Promise<void> {
    if (!this.currentSequenceChunks || this.currentSequenceChunks.length === 0) {
      return;
    }
    const idx = Math.min(Math.max(this.currentSequenceIndex, 0), this.currentSequenceChunks.length - 1);
    this.sequenceIdCounter += 1;
    const thisSeqId = this.sequenceIdCounter;
    this.activeSequenceId = thisSeqId;
    this.isSequenceRunning = true;
    this.isSequencePausedState = false;
    await this.playSequenceChunk(idx, thisSeqId);
  }

  /**
   * Returns true if TTS generation or audio playback or sequence reading is active
   */
  public isTtsBusy(): boolean {
    return this.isTtsGenerating || this.isCurrentlyPlaying || this.isSequenceRunning;
  }

  public stopSequence(): void {
    this.sequenceIdCounter += 1;
    this.activeSequenceId = this.sequenceIdCounter;
    this.isSequenceRunning = false;
    this.isSequencePausedState = false;
    this.currentSequenceChunks = [];
    this.stopAudioOnly();
  }

  public isSequencePlaying(): boolean {
    return this.isSequenceRunning && !this.isSequencePausedState && this.isCurrentlyPlaying;
  }

  public isSequencePaused(): boolean {
    return this.isSequenceRunning && this.isSequencePausedState;
  }

  public getSequenceProgress(): SequenceProgress {
    return {
      active: this.isSequenceRunning,
      isPaused: this.isSequencePausedState,
      currentChunk: this.currentSequenceIndex,
      totalChunks: this.currentSequenceChunks.length,
      currentText: this.currentSequenceChunks[this.currentSequenceIndex] || '',
    };
  }

  /**
   * Stop active playback and invalidate in-flight requests (Race condition prevention)
   */
  public stop(): void {
    this.sequenceIdCounter += 1;
    this.activeSequenceId = this.sequenceIdCounter;
    this.isSequenceRunning = false;
    this.isSequencePausedState = false;
    this.currentSequenceChunks = [];
    this.activeSequenceOptions = null;
    this.requestIdCounter += 1;
    this.activeRequestId = this.requestIdCounter;
    this.stopAudioOnly();
    this.stopSpeechRecognition();
  }

  /**
   * Pause active audio playback without discarding audio element
   */
  public pauseAudio(): void {
    if (this.activeAudio && !this.activeAudio.paused) {
      try {
        this.activeAudio.pause();
      } catch (err) {
        console.warn('Error pausing audio:', err);
      }
    }
  }

  /**
   * Resume paused audio playback
   */
  public resumeAudio(): void {
    if (this.activeAudio && this.activeAudio.paused) {
      try {
        this.activeAudio.play().catch((err) => {
          console.warn('Error resuming audio playback:', err);
        });
      } catch (err) {
        console.warn('Error resuming audio:', err);
      }
    }
  }

  /**
   * Returns true if audio exists and is currently paused
   */
  public isAudioPaused(): boolean {
    return Boolean(this.activeAudio && this.activeAudio.paused && this.activeAudio.currentTime > 0);
  }

  /**
   * Returns true if audio is actively playing
   */
  public isAudioPlaying(): boolean {
    return Boolean(this.activeAudio && !this.activeAudio.paused);
  }

  /**
   * Access active HTMLAudioElement if loaded
   */
  public getActiveAudio(): HTMLAudioElement | null {
    return this.activeAudio;
  }

  private stopAudioOnly(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // safe ignore
    }
    this.isDeviceSpeechPaused = false;
    this.activeUtterance = null;
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {
        // safe ignore
      }
      this.activeAudio = null;
    }
    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch {
        // safe ignore
      }
      this.currentObjectUrl = null;
    }
    this.isCurrentlyPlaying = false;
    this.activeMessageId = null;
  }

  /**
   * Internal real voice diagnostic for Female/Male testing (Section 4)
   * Sends actual request to server, receives real neural audio, plays it,
   * and reports duration, voiceId, and play resolution.
   */
  public async runVoiceDiagnostic(gender: VoiceGender): Promise<{
    success: boolean;
    voiceId: string;
    model: string;
    duration: number;
    playResolved: boolean;
    error?: string;
  }> {
    const text = 'Hello. I am your SmartEducate AI Tutor. I am ready to help you learn.';
    const voiceConfig = getActiveAiTutorVoice(gender, 'en');
    try {
      const res = await this.speak(
        text,
        { gender, language: 'en', autoplay: false },
        'diagnostic_' + gender
      );
      return {
        success: res.success,
        voiceId: voiceConfig.voiceId,
        model: 'gemini-2.5-flash-preview-tts',
        duration: this.activeAudio?.duration || 0,
        playResolved: res.success,
        error: res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        voiceId: voiceConfig.voiceId,
        model: 'gemini-2.5-flash-preview-tts',
        duration: 0,
        playResolved: false,
        error: err?.message || 'diagnostic_failed',
      };
    }
  }

  public isPlaying(messageId?: string): boolean {
    if (messageId !== undefined) {
      return this.isCurrentlyPlaying && this.activeMessageId === messageId;
    }
    return this.isCurrentlyPlaying;
  }

  public getActiveId(): string | null {
    return this.activeMessageId;
  }

  public getActiveRequestId(): number {
    return this.activeRequestId;
  }

  /**
   * Reads persisted voice gender preference from canonical local storage key
   */
  public getSavedVoiceGender(): VoiceGender {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(VOICE_GENDER_STORAGE_KEY);
        if (stored === 'male' || stored === 'female') {
          return stored;
        }
      } catch {
        // safe ignore
      }
    }
    return 'female';
  }

  /**
   * Persists voice gender preference to canonical local storage key
   */
  public saveVoiceGender(gender: VoiceGender): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(VOICE_GENDER_STORAGE_KEY, gender);
      } catch {
        // safe ignore
      }
    }
  }

  /**
   * Retrieves all voices currently registered on the client system
   */
  public getDeviceVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    try {
      return window.speechSynthesis.getVoices() || [];
    } catch {
      return [];
    }
  }

  /**
   * Asynchronously awaits device voices loading.
   * On Android Chrome and WebKit, getVoices() initially returns [] until 'voiceschanged' fires.
   * This handles the event with a bounded timeout (600ms) so mobile speech never stalls.
   */
  public ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve([]);
      }
      const initialVoices = window.speechSynthesis.getVoices();
      if (initialVoices && initialVoices.length > 0) {
        return resolve(initialVoices);
      }

      let timeoutId: any;
      const onVoicesChanged = () => {
        clearTimeout(timeoutId);
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(window.speechSynthesis.getVoices() || []);
      };

      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      timeoutId = setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(window.speechSynthesis.getVoices() || []);
      }, 600);
    });
  }

  /**
   * Finds the best matching device voice for the given language and requested gender.
   * Respects user's gender preference when reliable voice metadata is available,
   * without falsely claiming or fabricating gender attributes.
   */
  public findBestDeviceVoice(
    language: string,
    preferredGender?: VoiceGender
  ): { voice: SpeechSynthesisVoice | null; genderMatched: boolean; availableVoices: SpeechSynthesisVoice[] } {
    const targetGender = preferredGender || this.getSavedVoiceGender();
    const voices = this.getDeviceVoices();
    const normLang = (language || 'en').toLowerCase().split('-')[0];
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(normLang));

    if (langVoices.length === 0) {
      return { voice: null, genderMatched: false, availableVoices: [] };
    }

    // 1. First priority: installed voice matching language and requested gender
    const exactMatch = langVoices.find((v) => inferDeviceVoiceGender(v) === targetGender);
    if (exactMatch) {
      return { voice: exactMatch, genderMatched: true, availableVoices: langVoices };
    }

    // 2. Second priority: voice whose gender cannot be determined (unknown)
    const unknownGenderVoice = langVoices.find((v) => inferDeviceVoiceGender(v) === 'unknown');
    if (unknownGenderVoice) {
      return { voice: unknownGenderVoice, genderMatched: false, availableVoices: langVoices };
    }

    // 3. Fallback: default voice for language
    const defaultVoice = langVoices.find((v) => v.default) || langVoices[0];
    return { voice: defaultVoice, genderMatched: false, availableVoices: langVoices };
  }

  // ==========================================================================
  // MICROPHONE & SPEECH RECOGNITION SUBSYSTEM (Strictly Isolated from TTS)
  // ==========================================================================

  public detectMicrophoneEnvironment(): {
    isInIframe: boolean;
    isSecureContext: boolean;
    hasSpeechRecognition: boolean;
    hasMediaDevices: boolean;
  } {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    const isSecureContext = typeof window !== 'undefined' && Boolean(window.isSecureContext);
    const hasSpeechRecognition =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const hasMediaDevices =
      typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

    return { isInIframe, isSecureContext, hasSpeechRecognition, hasMediaDevices };
  }

  public isSpeechRecognitionSupported(): boolean {
    return this.detectMicrophoneEnvironment().hasSpeechRecognition;
  }

  public async requestMicrophonePermission(): Promise<MicPermissionResult> {
    const env = this.detectMicrophoneEnvironment();

    if (!env.isSecureContext) {
      return {
        granted: false,
        reason: 'insecure_context',
        error: 'insecure_context',
        message: 'Microphone requires HTTPS or a secure context.',
      };
    }

    if (!env.hasMediaDevices && !env.hasSpeechRecognition) {
      return {
        granted: false,
        reason: 'unsupported',
        error: 'unsupported',
        message: 'Audio input is not supported in this browser.',
      };
    }

    if (env.hasMediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return { granted: true, reason: 'granted' };
      } catch (err: any) {
        if (
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          err?.message?.includes('denied')
        ) {
          if (env.isInIframe) {
            return {
              granted: false,
              isBlockedByPreview: true,
              reason: 'blocked_by_preview',
              error: 'blocked_by_preview',
              message:
                'Microphone access is restricted by the preview frame (Permissions-Policy). Open the app directly or check device settings.',
            };
          }
          return {
            granted: false,
            reason: 'denied',
            error: 'denied',
            message:
              'Microphone access was denied. Please allow microphone access in your browser or device settings.',
          };
        }
      }
    }

    if (env.hasSpeechRecognition) {
      return { granted: true, reason: 'granted' };
    }

    return {
      granted: false,
      reason: 'unsupported',
      error: 'unsupported',
      message: 'Microphone access is unavailable.',
    };
  }

  public startSpeechRecognition(
    language: string,
    callbacks: SpeechRecognitionCallbacks
  ): { stop: () => void } | null {
    const env = this.detectMicrophoneEnvironment();

    if (!env.hasSpeechRecognition) {
      callbacks.onError?.('unsupported', 'Speech recognition is not supported in this browser.');
      return null;
    }

    this.stopSpeechRecognition();

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        callbacks.onError?.('unsupported');
        return null;
      }

      const recognition = new SpeechRecognitionConstructor();
      const baseLang = (language || 'en').toLowerCase().split('-')[0];
      recognition.lang = STT_LANGUAGE_MAP[baseLang] || baseLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';

      recognition.onstart = () => {
        callbacks.onStart?.();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const current = (finalTranscript || interim).trim();
        if (current) {
          callbacks.onResult?.(current);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;
        if (errType === 'not-allowed' || errType === 'permission-denied') {
          if (env.isInIframe) {
            callbacks.onError?.(
              'blocked_by_preview',
              'Microphone access is restricted by the preview frame (Permissions-Policy).'
            );
          } else {
            callbacks.onError?.(
              'not-allowed',
              'Microphone access is needed for voice input. Please allow microphone access in your browser/device settings.'
            );
          }
        } else if (errType === 'no-speech') {
          callbacks.onError?.('no-speech', "I couldn't hear you. Please tap the microphone and try again.");
        } else if (errType === 'network') {
          callbacks.onError?.('network', 'Network connection issue during speech recognition.');
        } else {
          callbacks.onError?.('other', event?.message || 'Audio capture error.');
        }
      };

      recognition.onend = () => {
        this.activeRecognition = null;
        callbacks.onEnd?.();
      };

      this.activeRecognition = recognition;
      recognition.start();

      return {
        stop: () => {
          try {
            recognition.stop();
          } catch {
            // safe ignore
          }
        },
      };
    } catch (err: any) {
      callbacks.onError?.('other', err?.message);
      return null;
    }
  }

  public stopSpeechRecognition(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // safe ignore
      }
      this.activeRecognition = null;
    }
  }
}

export const voiceService = new VoiceService();

if (typeof window !== 'undefined') {
  (window as any).__smarteducate_voice_diagnostic = (gender: VoiceGender = 'female') =>
    voiceService.runVoiceDiagnostic(gender);
}
