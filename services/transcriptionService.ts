/**
 * Dedicated Voice Audio Transcription Service using model gemini-3.5-transcribe
 */

export interface TranscribeResult {
  text: string;
  model?: string;
  provider?: string;
  durationMs?: number;
}

export class MicrophonePermissionError extends Error {
  readonly isPermissionDenied = true;
  constructor(message = 'Microphone permission was denied. Please allow microphone access in your browser settings.') {
    super(message);
    this.name = 'MicrophonePermissionError';
  }
}

export function isMicPermissionDenied(err: any): boolean {
  if (!err) return false;
  if (err instanceof MicrophonePermissionError || err.isPermissionDenied) return true;
  const name = String(err.name || '');
  const msg = String(err.message || '').toLowerCase();
  return (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    name === 'SecurityError' ||
    msg.includes('permission denied') ||
    msg.includes('permission dismissed') ||
    msg.includes('not allowed') ||
    msg.includes('user denied')
  );
}

export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export async function checkMicrophonePermissionState(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unsupported';
  }
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const perm = await navigator.permissions.query({ name: 'microphone' as any });
      return (perm.state as 'granted' | 'prompt' | 'denied') || 'prompt';
    } catch (e) {
      // 'microphone' query not supported in some browsers (e.g. Firefox/Safari), default to 'prompt'
      return 'prompt';
    }
  }
  return 'prompt';
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Microphone access is not supported by your browser.');
  }

  try {
    // Attempt standard prompt with basic audio constraint
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately after permission check
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err: any) {
    if (isMicPermissionDenied(err)) {
      return false;
    }
    throw err;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export class TranscriptionService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /**
   * Request microphone permission and start recording audio
   */
  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported by your browser.');
    }

    this.audioChunks = [];
    try {
      // First try with enhanced constraints
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      // If enhanced constraints failed, try simple audio: true fallback
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (innerErr: any) {
        if (isMicPermissionDenied(innerErr)) {
          throw new MicrophonePermissionError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
        }
        throw innerErr;
      }
    }

    // Determine supported mime type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Slice every 250ms
  }

  /**
   * Stop recording and return the recorded Blob
   */
  async stopRecording(): Promise<{ blob: Blob; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('No active recording session.'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        
        // Clean up audio tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];

        resolve({ blob, mimeType });
      };

      this.mediaRecorder.onerror = (err) => {
        reject(err);
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  /**
   * Cancel ongoing recording and release microphone
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Browser-native SpeechRecognition for direct real-time dictation
   */
  startSpeechRecognition(options: {
    onResult: (text: string, isFinal: boolean) => void;
    onError?: (err: any) => void;
    onEnd?: () => void;
    lang?: string;
  }): { stop: () => void; abort: () => void } | null {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = options.lang || 'en-IN';

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        options.onResult(finalText || interimText, Boolean(finalText));
      };

      recognition.onerror = (event: any) => {
        if (options.onError) options.onError(event);
      };

      recognition.onend = () => {
        if (options.onEnd) options.onEnd();
      };

      recognition.start();
      return {
        stop: () => {
          try { recognition.stop(); } catch (e) {}
        },
        abort: () => {
          try { recognition.abort(); } catch (e) {}
        },
      };
    } catch (e) {
      if (options.onError) options.onError(e);
      return null;
    }
  }

  /**
   * Convert Blob to base64 string
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xxx;base64,
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Transcribe recorded audio blob or base64 using server endpoint (gemini-3.5-transcribe)
   */
  async transcribeAudio(
    audioSource: Blob | string,
    mimeType = 'audio/webm',
    prompt = 'Transcribe this voice recording accurately. Keep all sports rules, drills, positions, player names, and teacher/coach feedback exact.'
  ): Promise<TranscribeResult> {
    let base64Audio = '';
    if (typeof audioSource === 'string') {
      base64Audio = audioSource.replace(/^data:[^;]+;base64,/, '');
    } else {
      base64Audio = await this.blobToBase64(audioSource);
      mimeType = audioSource.type || mimeType;
    }

    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType: mimeType.split(';')[0], // Extract clean mime type
        prompt,
      }),
    });

    if (!response.ok) {
      let errMessage = 'Transcription request failed';
      try {
        const errJson = await response.json();
        errMessage = errJson.message || errJson.error || errMessage;
      } catch (e) {
        // ignore
      }
      throw new Error(errMessage);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      model: data.model || 'gemini-3.5-transcribe',
      provider: data.provider || 'gemini',
    };
  }
}

export const transcriptionService = new TranscriptionService();
