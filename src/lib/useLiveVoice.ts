import { useState, useRef, useEffect, useCallback } from 'react';

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface LiveVoiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicActive: boolean;
  isModelSpeaking: boolean;
  audioVolume: number;
  statusText: string;
  error: string | null;
  transcripts: { speaker: 'user' | 'gemini'; text: string; time: string }[];
}

export function useLiveVoice() {
  const [state, setState] = useState<LiveVoiceState>({
    isConnected: false,
    isConnecting: false,
    isMicActive: false,
    isModelSpeaking: false,
    audioVolume: 0,
    statusText: 'Disconnected',
    error: null,
    transcripts: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackStateRef = useRef<{ nextTime: number; sources: AudioBufferSourceNode[] }>({
    nextTime: 0,
    sources: [],
  });

  const stopAllPlayback = useCallback(() => {
    for (const src of playbackStateRef.current.sources) {
      try {
        src.stop();
      } catch {}
    }
    playbackStateRef.current.sources = [];
    playbackStateRef.current.nextTime = 0;
    setState((prev) => ({ ...prev, isModelSpeaking: false }));
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const buffer = base64ToArrayBuffer(base64Audio);
      const int16 = new Int16Array(buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, playbackStateRef.current.nextTime);
      source.start(startTime);
      playbackStateRef.current.nextTime = startTime + audioBuffer.duration;
      playbackStateRef.current.sources.push(source);

      setState((prev) => ({ ...prev, isModelSpeaking: true, statusText: 'Gemini Live Speaking...' }));

      source.onended = () => {
        const list = playbackStateRef.current.sources;
        const idx = list.indexOf(source);
        if (idx !== -1) list.splice(idx, 1);
        if (list.length === 0) {
          setState((prev) => ({ ...prev, isModelSpeaking: false, statusText: 'Listening...' }));
        }
      };
    } catch (e) {
      console.error('[useLiveVoice] Error playing audio chunk:', e);
    }
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      const source = inputCtx.createMediaStreamSource(stream);
      // ScriptProcessor for 16kHz PCM downsampling/buffering
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for UI visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        setState((prev) => ({ ...prev, audioVolume: Math.min(1, avg * 5) }));

        // Only stream if websocket is OPEN
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pcmBuffer = floatTo16BitPCM(inputData);
          const base64 = arrayBufferToBase64(pcmBuffer);
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      setState((prev) => ({ ...prev, isMicActive: true, statusText: 'Listening to microphone...' }));
    } catch (err: any) {
      console.error('[useLiveVoice] Microphone error:', err);
      setState((prev) => ({
        ...prev,
        isMicActive: false,
        error: `Microphone access denied: ${err.message}`,
      }));
    }
  }, []);

  const stopMic = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    setState((prev) => ({ ...prev, isMicActive: false, audioVolume: 0 }));
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
      statusText: 'Connecting to Gemini Live API...',
    }));

    // Derive WS URL matching current window host & port
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        statusText: 'Live session connected. Initializing voice channel...',
      }));

      // Automatically engage microphone
      await startMic();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'audio' && data.audio) {
          playAudioChunk(data.audio);
        } else if (data.type === 'interrupted') {
          stopAllPlayback();
          setState((prev) => ({ ...prev, statusText: 'Interrupted by user' }));
        } else if (data.type === 'turnComplete') {
          setState((prev) => ({ ...prev, statusText: 'Gemini finished speaking' }));
        } else if (data.type === 'ready') {
          setState((prev) => ({
            ...prev,
            statusText: `Live Channel Active (${data.model || 'gemini-3.1-flash-live-preview'})`,
          }));
        } else if (data.type === 'info') {
          setState((prev) => ({ ...prev, statusText: data.message }));
        } else if (data.type === 'error') {
          setState((prev) => ({ ...prev, error: data.message, statusText: 'Live connection warning' }));
        }
      } catch (err) {
        console.error('[useLiveVoice] WebSocket parse error:', err);
      }
    };

    ws.onerror = (e) => {
      console.error('[useLiveVoice] WebSocket error:', e);
      setState((prev) => ({
        ...prev,
        error: 'WebSocket connection failed. Check network or server status.',
        isConnecting: false,
      }));
    };

    ws.onclose = () => {
      stopMic();
      stopAllPlayback();
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        isMicActive: false,
        statusText: 'Disconnected',
      }));
    };
  }, [startMic, stopMic, playAudioChunk, stopAllPlayback]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopMic();
    stopAllPlayback();
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isMicActive: false,
      statusText: 'Disconnected',
    }));
  }, [stopMic, stopAllPlayback]);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
      setState((prev) => ({
        ...prev,
        transcripts: [
          ...prev.transcripts,
          { speaker: 'user', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ],
      }));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    startMic,
    stopMic,
    sendTextMessage,
  };
}
