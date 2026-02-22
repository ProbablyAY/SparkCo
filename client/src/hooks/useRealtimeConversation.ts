import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

type Status = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export const useRealtimeConversation = (sessionId: string) => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const bufferRef = useRef<{ speaker: 'user' | 'ai'; text: string; startMs?: number; endMs?: number }[]>([]);

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;
    const items = bufferRef.current.splice(0, bufferRef.current.length);
    await api.post(`/sessions/${sessionId}/utterances/batch`, { items });
  }, [sessionId]);

  const start = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      const tokenRes = await api.post(`/sessions/${sessionId}/realtime-token`);
      const token = tokenRes.data.token;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const audio = document.createElement('audio');
      audio.autoplay = true;
      pc.ontrack = (e) => {
        setStatus('speaking');
        audio.srcObject = e.streams[0];
      };

      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = media;
      media.getTracks().forEach((track) => pc.addTrack(track, media));

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type?.includes('transcript') && msg.transcript) {
            const speaker = msg.role === 'assistant' ? 'ai' : 'user';
            bufferRef.current.push({ speaker, text: msg.transcript, startMs: msg.audio_start_ms, endMs: msg.audio_end_ms });
          }
          if (msg.type?.includes('response.audio.delta')) setStatus('speaking');
          if (msg.type?.includes('input_audio_buffer')) setStatus('listening');
        } catch {
          // ignore non-json events
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp'
        }
      });

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      setStatus('listening');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to connect realtime');
    }
  }, [sessionId]);

  const stop = useCallback(async () => {
    await flush();
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus('idle');
  }, [flush]);

  useEffect(() => {
    const interval = setInterval(() => {
      flush().catch(() => undefined);
    }, 2500);
    return () => {
      clearInterval(interval);
      stop().catch(() => undefined);
    };
  }, [flush, stop]);

  return { status, error, start, stop };
};
