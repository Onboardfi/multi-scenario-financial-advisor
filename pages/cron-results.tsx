import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CronResult {
  id: number;
  session: string;
  result: string;
  created_at: string;
}

export default function CronResults() {
  const [results, setResults] = useState<CronResult[]>([]);

  useEffect(() => {
    async function fetchResults() {
      const { data, error } = await supabase
        .from('cron_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching results:', error);
      } else {
        setResults(data || []);
      }
    }

    fetchResults();
  }, []);

  return (
    <div>
      <h1>Cron Job Results</h1>
      {results.map((result) => (
        <div key={result.id}>
          <h2>Session: {result.session}</h2>
          <p>Created at: {new Date(result.created_at).toLocaleString()}</p>
          <pre>{JSON.stringify(JSON.parse(result.result), null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}