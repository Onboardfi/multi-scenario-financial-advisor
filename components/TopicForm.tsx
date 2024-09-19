"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const TopicForm = () => {
  const [topicName, setTopicName] = useState('');
  const [message, setMessage] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isAudioRecorded, setIsAudioRecorded] = useState(false);

  useEffect(() => {
    fetchCurrentTopic();
  }, []);

  const fetchCurrentTopic = async () => {
    if (!supabase) {
      setMessage('Unable to connect to the database. Please try again later.');
      return;
    }

    const { data, error } = await supabase
      .from('topic')
      .select('name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching current topic:', error);
      setMessage('Failed to fetch current topic.');
    } else if (data) {
      setCurrentTopic(data.name);
    }
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setMessage('');
    setTopicName('');

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
      console.log('Audio blob size:', audioBlob.size);

      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      console.log('Sending request to /api/transcribe...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        const transcription = data.text.trim();
        setTopicName(transcription);
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

  const handleSubmit = async () => {
    if (!topicName) {
      setMessage('No text to submit.');
      return;
    }

    try {
      if (!supabase) {
        setMessage('Unable to connect to the database. Please try again later.');
        return;
      }

      const { data: insertData, error } = await supabase
        .from('topic')
        .insert([{ name: topicName }]);

      if (error) throw error;

      setMessage('Scenario added successfully!');
      setTopicName('');
      fetchCurrentTopic(); // Refresh the current topic after adding a new one
    } catch (error) {
      setMessage('Failed to add Ticker. Please try again.');
      console.error('Error adding Ticker:', error);
    }
  };



  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add New Ticker</h2>
      <div className="space-y-4">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`w-full p-2 text-white rounded ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={isTranscribing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <button
          onClick={handleTranscribe}
          className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={isTranscribing || isRecording || !isAudioRecorded}
        >
          {isTranscribing ? 'Transcribing...' : 'Transcribe'}
        </button>

        <input
          type="text"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          placeholder="Transcribed text will appear here"
          className="w-full p-2 border border-gray-300 rounded"
        />

        <button
          onClick={handleSubmit}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={isTranscribing || isRecording || !topicName}
        >
          Submit Ticker
        </button>
      </div>
      {message && <p className="mt-4 text-center">{message}</p>}
      {currentTopic && (
        <p className="mt-4 text-center">
          Current Ticker: <strong>{currentTopic}</strong>
        </p>
      )}
    </div>
  );
};

export default TopicForm;
