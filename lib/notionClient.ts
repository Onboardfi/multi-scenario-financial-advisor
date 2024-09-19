// /Users/bobbygilbert/Documents/Github/stonks/lib/notionClient.ts

export const addMessageToNotion = async (messageContent: string) => {
    if (!messageContent) {
      return { success: false, error: 'Message content is empty' };
    }
  
    try {
      const response = await fetch('/api/addMessageToNotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageContent }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add message to Notion');
      }
  
      return { success: true };
    } catch (error: any) {
      console.error('Error appending message to Notion:', error);
      return { success: false, error: error.message };
    }
  };