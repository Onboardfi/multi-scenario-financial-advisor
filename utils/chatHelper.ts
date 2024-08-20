import fetch from 'node-fetch';

export async function sendMessage(value: string, session: string) {
  console.log(`Sending request to SuperAgent API for session ${session}`);
  const startTime = Date.now();

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
        enableStreaming: false,
      }),
    }
  );

  const endTime = Date.now();
  console.log(`SuperAgent API responded in ${endTime - startTime}ms for session ${session}`);

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
  }

  return response.json();
}