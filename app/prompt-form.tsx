"use client";

import * as React from "react";
import { RxArrowUp, RxPlus, RxStop } from "react-icons/rx";
import Textarea from "react-textarea-autosize";
import { v4 as uuid } from "uuid";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Mic, MicOff, Send, Plus, StopCircle, FileAudio } from "lucide-react";

export interface PromptProps {
  onSubmit: (value?: string) => Promise<void>;
  isLoading: boolean;
  onCreateSession: (value: string) => Promise<void>;
  onStop: () => void;
}

export default function PromptForm({
  onSubmit,
  isLoading,
  onCreateSession,
  onStop,
}: PromptProps) {
  const [input, setInput] = React.useState<string>('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = React.useState<Blob[]>([]);
  const [isAudioRecorded, setIsAudioRecorded] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleStartRecording = async () => {
    setIsRecording(true);
    setMessage('');
    setInput('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
        setIsAudioRecorded(true);
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMessage('Could not access your microphone. Please check your browser settings.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (audioChunks.length === 0) {
      setMessage('No audio recorded.');
      return;
    }

    setIsTranscribing(true);

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const transcription = data.text.trim();
        setInput(transcription);
        setMessage('Transcription successful! You can edit the text before submitting.');
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error: any) {
      setMessage(`Failed to transcribe audio: ${error.message}`);
      console.error('Error during transcription:', error);
    } finally {
      setIsTranscribing(false);
      setAudioChunks([]);
      setIsAudioRecorded(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim()) {
      return;
    }
    
    try {
      if (!supabase) {
        setMessage('Unable to connect to the database. Please try again later.');
        return;
      }

      const { data: insertData, error } = await supabase
        .from('topic')
        .insert([{ name: input }]);

      if (error) throw error;

      setMessage('Scenario added successfully!');
      await onSubmit(input);
      setInput('');
    } catch (error) {
      setMessage('Failed to add Scenario. Please try again.');
      console.error('Error adding Scenario:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <div className="relative flex flex-col justify-end bg-background px-8 sm:rounded-2xl sm:border sm:px-12">
        <Button
          onClick={() => onCreateSession(uuid())}
          className="absolute bottom-4 left-0 h-8 w-8 rounded-full bg-[#6601FF] p-0 sm:left-4 hover:bg-[#5c00e6]"
          title="New Chat"
        >
          <Plus className="h-4 w-4 text-white" />
          <span className="sr-only">New Chat</span>
        </Button>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a client scenario"
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none rounded-md"
        />
        <div className="absolute bottom-4 right-0 sm:right-4 flex space-x-2">
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`mt-1 h-8 w-8 rounded-md p-0 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6601FF] hover:bg-[#5c00e6]'
            }`}
            disabled={isTranscribing}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 text-white" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
            <span className="sr-only">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
          </Button>
          <Button
            onClick={handleTranscribe}
            className="mt-1 h-8 w-8 rounded-md p-0 bg-[#6601FF] hover:bg-[#5c00e6]"
            disabled={isTranscribing || isRecording || !isAudioRecorded}
            title="Transcribe"
          >
            <FileAudio className="h-4 w-4 text-white" />
            <span className="sr-only">Transcribe</span>
          </Button>
          {isLoading ? (
            <Button
              onClick={onStop}
              className="mt-1 h-8 w-8 rounded-md p-0 bg-yellow-500 hover:bg-yellow-600"
              title="Stop"
            >
              <StopCircle className="h-4 w-4 text-white" />
              <span className="sr-only">Stop</span>
            </Button>
          ) : (
            <Button
              type="submit"
              className="mt-1 h-8 w-8 rounded-md p-0 bg-[#6601FF] hover:bg-[#5c00e6]"
              title="Send message"
            >
              <Send className="h-4 w-4 text-white" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>
      </div>
      {message && <p className="mt-2 text-center text-sm text-gray-500">{message}</p>}
    </form>
  );
}
