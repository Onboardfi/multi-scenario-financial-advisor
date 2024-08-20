import { sendMessage } from "@/utils/chatHelper";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = uuidv4();

  try {
    console.log('Starting cron job...');
    const result = await sendMessage("AAPL", session);

    console.log('Message sent successfully, saving to Supabase...');
    
    try {
      const { error: supabaseError } = await supabaseAdmin
        .from('cron_results')
        .insert({ session, result: JSON.stringify(result) });

      if (supabaseError) {
        console.error('Error saving to Supabase:', supabaseError);
        throw supabaseError;
      }

      console.log('Result saved to Supabase');
      res.status(200).json({ message: "AAPL message sent and saved successfully" });
    } catch (supabaseError) {
      console.error('Supabase operation failed:', supabaseError);
      res.status(500).json({ error: "Failed to save result to database", details: supabaseError });
    }
  } catch (error: unknown) {
    console.error("Error in cron job:", error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    res.status(500).json({ error: "Failed to send or save AAPL message", details: errorMessage });
  }
}