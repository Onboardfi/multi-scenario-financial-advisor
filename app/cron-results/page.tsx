"use client"
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TickerTape } from '@/components/tradingview/ticker-tape';
import Message from '@/components/message';
import { Profile } from '@/types/profile';
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Metric,
  Flex,
  ProgressBar,
  Grid,
  Col
} from '@tremor/react';

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
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });
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

        // Calculate stats
        const total = data?.length || 0;
        const success = data?.filter(r => !!r.result).length || 0;
        const errorCount = data?.filter(r => !!r.error).length || 0;
        setStats({ total, success, error: errorCount });
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
    return (
      <Card className="mt-4">
        <Text className="text-red-500">{error}</Text>
      </Card>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TickerTape />
      <div className="flex-grow overflow-auto p-4">
        <Title className="mb-4">Cron Job Results Dashboard</Title>
        
        <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4 mb-4">
          <Card>
            <Text>Total Jobs</Text>
            <Metric>{stats.total}</Metric>
          </Card>
          <Card>
            <Text>Successful Jobs</Text>
            <Metric>{stats.success}</Metric>
            <Flex className="mt-2">
              <Text>Success Rate</Text>
              <Text>{((stats.success / stats.total) * 100).toFixed(1)}%</Text>
            </Flex>
            <ProgressBar value={(stats.success / stats.total) * 100} className="mt-2" />
          </Card>
          <Card>
            <Text>Failed Jobs</Text>
            <Metric>{stats.error}</Metric>
          </Card>
        </Grid>
        
        <Card>
          <Title>Recent Cron Job Executions</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Session</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Created At</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.id}</TableCell>
                  <TableCell>{result.session}</TableCell>
                  <TableCell>
                    <Badge color={result.result ? "green" : "red"}>
                      {result.result ? "Success" : "Error"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(result.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Title className="mt-8 mb-4">Detailed Results</Title>
        {results.length === 0 ? (
          <Card>
            <Text className="text-center">No results found.</Text>
          </Card>
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
              <Card key={result.id} className="mb-4">
                <Flex>
                  <Title>Job ID: {result.id}</Title>
                  <Badge color={result.result ? "green" : "red"}>
                    {result.result ? "Success" : "Error"}
                  </Badge>
                </Flex>
                <Text className="mt-2">Session: {result.session}</Text>
                <Text>Created At: {new Date(result.created_at).toLocaleString()}</Text>
                <Message
                  type="ai"
                  message={
                    parsedResult?.data?.steps 
                      ? parsedResult.data.steps.map(step => step.output).join("\n\n")
                      : result.error || 'No result or error recorded'
                  }
                  isSuccess={!!result.result}
                  profile={{} as Profile}
                  steps={parsedResult?.data?.steps?.reduce<Record<string, { content: string; linkType?: string }>>((acc, step, index) => {
                    acc[`Step ${index + 1}`] = { content: step.output, linkType: step.linkType };
                    return acc;
                  }, {})}
                />
              </Card>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}