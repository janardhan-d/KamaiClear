'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Languages, Mic, MicOff, Send, Volume2, X, Zap } from 'lucide-react';
import { ThinkingOrb as BaseThinkingOrb } from 'thinking-orbs';
import { VoiceBeam as BaseVoiceBeam, useMicrophone } from 'voice-glow';
import { ASSISTANT_EXAMPLES, ASSISTANT_LANGUAGES, AssistantLanguage, assistantReply, interpretAssistantCommand } from '@/lib/assistant';
import type { AssistantAction, AssistantCommand, AssistantContext } from '@/lib/assistant';
import type { ShiftInput } from '@/lib/earnings';
import { cn } from '@/lib/cn';

// Keep the Libraries.dev adapters local. Their playground examples include
// convenience props that are not accepted by every published package build;
// strip those props before they can fall through to a DOM canvas/div.
function ThinkingOrb(props: any) {
  const { dark, ...rest } = props;
  return <BaseThinkingOrb {...rest} theme={dark === false ? 'light' : rest.theme} />;
}

function VoiceBeam(props: any) {
  const { processing, ...rest } = props;
  return <BaseVoiceBeam {...rest} motion={processing ? { gather: 1, heldLevel: 0.45 } : null} active={rest.active ?? Boolean(processing)} />;
}

type Message = { id: string; role: 'assistant' | 'user'; text: string };

type RecognitionResult = {
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionResult) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type RecognitionConstructor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function KamaiClearAssistant({ context, onNavigate, onFillShift, onSaveShift }: { context: AssistantContext; onNavigate: (view: 'overview' | 'log' | 'history' | 'receipt') => void; onFillShift: (fields: Partial<ShiftInput>) => void; onSaveShift: () => void }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<AssistantLanguage>('en-IN');
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [modelSource, setModelSource] = useState<'live-model' | 'local-action-model' | 'local-fallback'>('local-action-model');
  const [status, setStatus] = useState('Ready. Ask in your language.');
  const [messages, setMessages] = useState<Message[]>(() => [{ id: 'welcome', role: 'assistant', text: assistantReply('hello', 'en-IN', context) }]);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const mic = useMicrophone();

  const examples = useMemo(() => ASSISTANT_EXAMPLES[language], [language]);
  const selectedLanguage = ASSISTANT_LANGUAGES.find((item) => item.code === language) ?? ASSISTANT_LANGUAGES[0];

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  function speak(text: string, restartListening = false) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.onstart = () => { setSpeaking(true); setStatus('Speaking…'); };
    utterance.onend = () => {
      setSpeaking(false);
      setStatus(restartListening ? 'Listening again…' : 'Ready. Ask in your language.');
      if (restartListening) startListening();
    };
    utterance.onerror = () => { setSpeaking(false); setStatus('I could not play the voice response.'); };
    window.speechSynthesis.speak(utterance);
  }

  function addReply(text: string, source: string, voiceReply = false) {
    setMessages((current) => [...current, { id: `${source}-${Date.now()}`, role: 'user', text: source }, { id: `reply-${Date.now()}`, role: 'assistant', text }]);
    setStatus(voiceReply ? 'Preparing a spoken answer…' : 'Answer ready.');
    if (voiceReply) speak(text, true);
  }

  function applyAction(action: AssistantAction) {
    if (action.type === 'navigate') onNavigate(action.view);
    if (action.type === 'fill_shift') {
      onFillShift(action.fields);
      onNavigate('log');
    }
    if (action.type === 'save_shift') onSaveShift();
  }

  async function send(text = input, voiceReply = false) {
    const clean = text.trim();
    if (!clean) return;
    setInput('');
    setThinking(true);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, language, context }),
      });
      if (!response.ok) throw new Error('Assistant route unavailable');
      const payload = await response.json() as AssistantCommand & { source?: 'live-model' | 'local-action-model' | 'local-fallback' };
      const command = payload;
      setModelSource(payload.source ?? 'local-action-model');
      addReply(command.response, clean, voiceReply);
      applyAction(command.action);
    } catch {
      const command = interpretAssistantCommand(clean, language, context);
      setModelSource('local-fallback');
      addReply(command.response, clean, voiceReply);
      applyAction(command.action);
    } finally {
      setThinking(false);
    }
  }

  function startListening() {
    if (typeof window === 'undefined') return;
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('Microphone transcription is not available here. You can type instead.');
      return;
    }

    recognitionRef.current?.stop();
    void mic.start();
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index]?.[0]?.transcript ?? '').join(' ').trim();
      if (transcript) {
        setInput(transcript);
        send(transcript, handsFree);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatus(event.error === 'not-allowed' ? 'Microphone permission was denied. Type instead or enable microphone access.' : 'I could not hear that. Please try again.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setStatus(handsFree ? 'Listening for a voice question…' : `Listening in ${selectedLanguage.label}…`);
    } catch {
      setStatus('The microphone is busy. Please try again.');
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    mic.stop();
    setListening(false);
    setStatus('Microphone stopped.');
  }

  return <>
    <button type="button" className={cn('ak-assistant-launcher', open && 'is-open')} onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close KamaiClear assistant' : 'Open KamaiClear assistant'} aria-expanded={open}><Bot size={21} /><span>Assistant</span></button>
    {open && <section className="ak-assistant" role="dialog" aria-modal="false" aria-labelledby="assistant-title"><header className="ak-assistant-head"><div className="ak-assistant-title"><div className="ak-assistant-icon"><Bot size={18} /></div><div><h2 id="assistant-title">KamaiClear Assistant</h2><p>Ask a question or tell me what you want to record.</p></div></div><button type="button" className="ak-assistant-close" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={17} /></button></header><div className="ak-assistant-controls"><label><Languages size={14} aria-hidden="true" /><span className="sr-only">Assistant language</span><select value={language} onChange={(event) => setLanguage(event.target.value as AssistantLanguage)}>{ASSISTANT_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label><button type="button" className={cn('ak-voice-mode', handsFree && 'is-active')} onClick={() => setHandsFree((value) => !value)} aria-pressed={handsFree}><Zap size={13} />{handsFree ? 'Hands-free on' : 'Hands-free'}</button></div><div className="ak-assistant-messages" aria-live="polite">{messages.map((message) => <div key={message.id} className={cn('ak-assistant-message', message.role)}><p>{message.text}</p>{message.role === 'assistant' && <button type="button" onClick={() => speak(message.text)} aria-label="Read this answer aloud"><Volume2 size={13} />Read aloud</button>}</div>)}{thinking && <div className="ak-assistant-thinking"><ThinkingOrb state="working" size={20} dark={false} /><span>Working on your request…</span></div>}</div><div className="ak-assistant-examples"><span>Suggestions</span>{examples.map((example) => <button type="button" key={example} onClick={() => send(example)}>{example}</button>)}</div><VoiceBeam stream={mic.stream} processing={thinking} colorVariant="ocean" theme="light" type="default" className="ak-voice-beam"><form className="ak-assistant-input" onSubmit={(event) => { event.preventDefault(); send(); }}><label htmlFor="assistant-message" className="sr-only">Type your question</label><input id="assistant-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a command or question…" autoComplete="off" /><button type="button" className={cn('ak-mic-button', listening && 'is-listening')} onClick={listening ? stopListening : startListening} aria-label={listening ? 'Stop listening' : 'Speak your question'}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button><button type="submit" className="ak-send-button" aria-label="Send question"><Send size={17} /></button></form></VoiceBeam><footer className="ak-assistant-status"><span className={cn('ak-status-dot', (listening || speaking) && 'active')} />{status}<span className="ak-assistant-note">{thinking ? 'Interpreting action…' : 'Review values before saving.'}</span></footer></section>}
  </>;
}
