"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const TopicForm = () => {
  const [topicName, setTopicName] = useState('');
  const [message, setMessage] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage('Unable to connect to the database. Please try again later.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('topic')
        .insert([{ name: topicName }]);
      
      if (error) throw error;
      
      setMessage('Ticker added successfully!');
      setTopicName('');
      fetchCurrentTopic();  // Refresh the current topic after adding a new one
    } catch (error) {
      setMessage('Failed to add Ticker. Please try again.');
      console.error('Error adding Ticker:', error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add New Ticker</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          placeholder="Enter Ticker name"
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Ticker
        </button>
      </form>
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