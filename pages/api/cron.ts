import { sendMessage } from "@/utils/chatHelper";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = uuidv4();
  let status = 'success';
  let result: any;
  let errorDetails: string | null = null;

  try {
    console.log('Starting cron job...');
    result = await sendMessage("AAPL", session);
    console.log('Message sent successfully');
  } catch (error: unknown) {
    console.error("Error in sendMessage:", error);
    status = 'error';
    if (error instanceof Error) {
      errorDetails = error.message;
    } else if (typeof error === 'string') {
      errorDetails = error;
    } else {
      errorDetails = 'Unknown error';
    }
  }

  try {
    console.log('Saving to Supabase...');
    const { error: supabaseError } = await supabaseAdmin
      .from('cron_results')
      .insert({ 
        session, 
        result: status === 'success' ? JSON.stringify(result) : null,
        error: errorDetails,
        status
      });

    if (supabaseError) {
      console.error('Error saving to Supabase:', supabaseError);
      throw supabaseError;
    }

    console.log('Result saved to Supabase');
    res.status(200).json({ 
      message: status === 'success' 
        ? "AAPL message sent and saved successfully" 
        : "Error occurred and saved successfully",
      status,
      errorDetails
    });
  } catch (supabaseError) {
    console.error('Supabase operation failed:', supabaseError);
    res.status(500).json({ 
      error: "Failed to save result to database", 
      details: supabaseError 
    });
  }
}