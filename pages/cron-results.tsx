import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TickerTape } from '@/components/tradingview/ticker-tape';
import Message from "@/components/message";
import { Profile } from "@/types/profile";

interface CronResult {
  id: number;
  session: string;
  result?: string;
  error?: string;
  created_at: string;
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
      <div className="flex-grow overflow-auto">
        <div className="flex flex-col space-y-4 p-2">
          {results.length === 0 ? (
            <p className="text-center">No results found.</p>
          ) : (
            results.map((result) => (
              <Message
                key={result.id}
                type="ai"
                message={result.result || result.error || "No content"}
                steps={{
                  [result.session]: {
                    content: result.result || result.error || "No content",
                    linkType: undefined
                  }
                }}
                profile={{} as Profile}
                isSuccess={!result.error}
              />
            ))
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </div>
    </div>
  );
}