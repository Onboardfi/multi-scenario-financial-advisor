import { NextApiRequest, NextApiResponse } from 'next';
import { sendMessage } from '@/utils/chatHelper';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = uuidv4();
    await sendMessage("AAPL", session);
    res.status(200).json({ message: "AAPL message sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send AAPL message" });
  }
}
