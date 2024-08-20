import { sendMessage } from "@/utils/chatHelper";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    const session = uuidv4();
    const result = await sendMessage("AAPL", session);
    
    // Save result to Supabase
    const { data, error } = await supabase
      .from('cron_results')
      .insert({ session, result: JSON.stringify(result) });

    if (error) throw error;

    res.status(200).json({ message: "AAPL message sent and saved successfully" });
  } catch (error) {
    console.error("Error in cron job:", error);
    res.status(500).json({ error: "Failed to send or save AAPL message" });
  }
}