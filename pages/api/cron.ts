import { sendMessage } from "@/utils/chatHelper";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = uuidv4();
  console.time(`cron-job-${session}`);

  try {
    // Authorization check
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Database connection check
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    console.log(`[${session}] Starting cron job...`);

    // Fetch the latest topic from the database
    const { data: latestTopic, error: topicError } = await supabaseAdmin
      .from('topic')
      .select('name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (topicError) {
      throw new Error('Failed to fetch the latest topic from the database');
    }

    if (!latestTopic) {
      throw new Error('No topics found in the database');
    }

    console.log(`[${session}] Latest topic: ${latestTopic.name}`);

    // Send message
    const result = await sendMessage(latestTopic.name, session);

    console.log(`[${session}] Message sent successfully, saving to Supabase...`);

    // Save result to database
    const { data: insertedData, error: supabaseError } = await supabaseAdmin
      .from('cron_results')
      .insert({ session, result: JSON.stringify(result), topic: latestTopic.name })
      .select()
      .single();

    if (supabaseError) {
      throw new Error('Failed to save result to database');
    }

    console.log(`[${session}] Result saved to Supabase:`, {
      session: insertedData.session,
      topic: insertedData.topic,
      resultSummary: JSON.stringify(insertedData.result).substring(0, 100) + '...'
    });

    res.status(200).json({ 
      message: `${latestTopic.name} message sent and saved successfully`,
      session: insertedData.session,
      topic: insertedData.topic
    });

  } catch (error: unknown) {
    console.error(`[${session}] Error in cron job:`, error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    res.status(500).json({ error: "Failed to execute cron job", details: errorMessage });
  } finally {
    console.timeEnd(`cron-job-${session}`);
  }
}