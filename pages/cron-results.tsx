"use client";
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TickerTape } from '@/components/tradingview/ticker-tape';
import Message from '@/components/message';
import { Profile } from '@/types/profile';

interface CronResult {
  id: number;
  session: string;
  result?: string;
  error?: string;
  created_at: string;
}

interface Step {
  output: string;
  linkType?: string;
}

export default function CronResults() {
  const [results, setResults] = useState<CronResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase configuration is missing');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function fetchResults() {
      try {
        const { data, error } = await supabase
          .from('cron_results')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        console.log('Fetched results:', data);
        setResults(data || []);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to fetch results. Please try again later.');
      }
    }

    fetchResults();
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [results]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <TickerTape />
      <div className="flex-grow overflow-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Cron Job Results</h1>
        {results.length === 0 ? (
          <p className="text-center">No results found.</p>
        ) : (
          results.map((result) => {
            let parsedResult: { data?: { steps?: Step[] } } | null = null;
            try {
              parsedResult = result.result ? JSON.parse(result.result) : null;
            } catch (parseError) {
              console.error('Error parsing result JSON:', parseError);
              parsedResult = null;
            }

            return (
              <Message
                key={result.id}
                type="ai"  // Assuming these messages are from an AI
                message={
                  parsedResult?.data?.steps 
                    ? parsedResult.data.steps.map(step => step.output).join("\n\n")
                    : result.error || 'No result or error recorded'
                }
                isSuccess={!!result.result}
                profile={{} as Profile}  // Replace with actual profile data if needed
                steps={parsedResult?.data?.steps?.reduce<Record<string, { content: string; linkType?: string }>>((acc, step, index) => {
                  acc[`Step ${index + 1}`] = { content: step.output, linkType: step.linkType };
                  return acc;
                }, {})}
              />
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}
