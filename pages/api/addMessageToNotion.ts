// /pages/api/addMessageToNotion.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

// Define the allowed color values as per Notion's API
type NotionTextColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "gray_background"
  | "brown_background"
  | "orange_background"
  | "yellow_background"
  | "green_background"
  | "blue_background"
  | "purple_background"
  | "pink_background"
  | "red_background";

// Define the RichText interface
interface NotionRichText {
  type: 'text';
  text: {
    content: string;
    link?: {
      url: string;
    };
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: NotionTextColor;
  };
}

// Define the ParagraphBlock interface
interface NotionParagraphBlock {
  object: 'block';
  type: 'paragraph';
  paragraph: {
    rich_text: NotionRichText[];
  };
}

// Union type for multiple block types (extend as needed)
type NotionBlock = NotionParagraphBlock;

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

const MAX_LENGTH = 2000; // Notion's maximum characters per text block

// Utility function to split text into chunks
const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    // Attempt to find the last space before the maxLength
    let lastSpace = text.lastIndexOf(' ', end);
    if (lastSpace > start) {
      chunks.push(text.slice(start, lastSpace));
      start = lastSpace + 1; // Move past the space
    } else {
      // If no space found, force split to avoid infinite loop
      chunks.push(text.slice(start, end));
      start = end;
    }
  }
  return chunks;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messageContent } = req.body;

  if (!messageContent || typeof messageContent !== 'string' || messageContent.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid message content' });
  }

  const pageId = process.env.NOTION_PAGE_ID;

  if (!pageId) {
    return res.status(500).json({ error: 'Notion page ID is not set' });
  }

  try {
    // Split the message into chunks of <= 2000 characters
    const chunks = splitTextIntoChunks(messageContent.trim(), MAX_LENGTH);

    // Prepare the blocks to append with correct typing
    const blocks: NotionBlock[] = chunks.map(chunk => ({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text', // Literal string 'text'
            text: {
              content: chunk,
            },
          },
        ],
      },
    }));

    // Append all blocks in a single request
    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error appending message to Notion:', error);
    res.status(500).json({ error: error.message || 'Failed to append message to Notion' });
  }
}
