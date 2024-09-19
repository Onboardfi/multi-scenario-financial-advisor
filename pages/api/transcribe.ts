import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({});

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log('Parsing form data...');
    const { fields, files } = await parseForm(req);

    const file = files.file;

    console.log('File received:', file);

    if (!file) {
      console.error('No file uploaded');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let audioFile: File;

    if (Array.isArray(file)) {
      if (file.length === 0) {
        console.error('No file uploaded');
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      if (file.length > 1) {
        console.error('Multiple files uploaded, expected single file');
        res.status(400).json({ error: 'Multiple files uploaded, expected single file' });
        return;
      }
      audioFile = file[0]; // Take the first file
    } else {
      audioFile = file;
    }

    console.log('Audio file details:', {
      size: audioFile.size,
      type: audioFile.mimetype,
      name: audioFile.originalFilename,
    });

    // Determine the file extension from the original filename or default to '.webm'
    const extension = path.extname(audioFile.originalFilename || '.webm') || '.webm';

    // Create a temporary file path with the correct extension
    const tempFilePath = path.join(os.tmpdir(), `${audioFile.newFilename}${extension}`);

    // Move the uploaded file to the temporary file path with the correct extension
    fs.renameSync(audioFile.filepath, tempFilePath);

    try {
      console.log('Sending request to OpenAI...');

      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath), {
        filename: audioFile.originalFilename || 'recording.webm',
        contentType: audioFile.mimetype || 'audio/webm',
      });
      formData.append('model', 'whisper-1');

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      console.log('Transcription successful');
      res.status(200).json({ text: response.data.text });
    } catch (error: any) {
      console.error('Error during transcription:', error.response?.data || error.message);
      res.status(500).json({ error: `Error during transcription: ${error.message}` });
    } finally {
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
    }
  } catch (err: any) {
    console.error('Error parsing the files:', err);
    res.status(500).json({ error: `Error parsing the files: ${err.message}` });
  }
};

export default handler;
