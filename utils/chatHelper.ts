import { fetchEventSource } from "@microsoft/fetch-event-source";

export async function sendMessage(value: string, session: string) {
  let messageByEventIds: Record<string, { content: string; linkType?: string }> = {}
  let currentEventId = ""

  const abortController = new AbortController();

  try {
    await fetchEventSource(
      `${process.env.NEXT_PUBLIC_SUPERAGENT_API_URL}/workflows/${process.env.NEXT_PUBLIC_WORKFLOW_ID}/invoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY}`,
        },
        body: JSON.stringify({
          input: value,
          enableStreaming: true,
          sessionId: session,
        }),
        openWhenHidden: true,
        signal: abortController.signal,
        async onopen(response) {
          // Handle any initialization if needed
        },
        onclose() {
          // Handle any cleanup if needed
        },
        onmessage(event) {
          if (event.id) currentEventId = event.id;
          try {
            if (event.event === "function_call") {
              // Handle function calls if needed
            } else if (event.event === "error") {
              console.error("Error:", event.data);
            } else if (event.data !== "[END]" && currentEventId) {
              if (!messageByEventIds[currentEventId]) {
                messageByEventIds[currentEventId] = { content: "" };
              }
              messageByEventIds[currentEventId].content += event.data === "" ? "\n" : event.data;
            }
          } catch (error) {
            console.error("Error processing event:", error);
          }
        },
        onerror(error) {
          throw error;
        },
      }
    );
  } catch (error) {
    console.error("Failed to send message:", error);
  } finally {
    abortController.abort();
  }
}
