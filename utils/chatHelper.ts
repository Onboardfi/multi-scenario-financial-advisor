import fetch from 'node-fetch';

export async function sendMessage(value: string, session: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPERAGENT_API_URL}/workflows/${process.env.NEXT_PUBLIC_WORKFLOW_ID}/invoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY}`,
        },
        body: JSON.stringify({
          input: value,
          sessionId: session,
          enableStreaming: false, // Set to false for cron job
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const data = await response.json();
    console.log("Message sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
}