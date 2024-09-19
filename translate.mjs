// node translate.mjs path/to/thesis_audio.json
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { ElevenLabsClient } from "elevenlabs";
import { createWriteStream } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const CROSSHATCH_API_KEY = process.env.CROSSHATCH_API_KEY;

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

async function readJsonFile(filePath) {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function translateText(text, targetLanguage) {
  const response = await fetch('https://api.crosshatch.app/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CROSSHATCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert language translator. Given the provided text in English, translate it to ${targetLanguage}. The content provided is a podcast transcript of TWO speakers. Your task is to produce a SINGLE-SPEAKER transcript. Do your utmost to preserve the tone and style of the original. Do not return any preamble, just go straight into the translation.`
        },
        {
          role: 'user',
          content: `PODCAST TRANSCRIPT:\n\n${text}`
        }
      ],
      stream: false
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function createAudioFileFromText(text, outputFileName) {
  return new Promise(async (resolve, reject) => {
    try {
      const audio = await client.generate({
        voice: "George",
        model_id: "eleven_turbo_v2_5",
        text,
      });
      const fileStream = createWriteStream(outputFileName);

      audio.pipe(fileStream);
      fileStream.on("finish", () => resolve(outputFileName));
      fileStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  const [inputFile, targetLanguage] = process.argv.slice(2);
  if (!inputFile || !targetLanguage) {
    console.error('Please provide an input JSON file and target language.');
    console.error('Usage: node translate.mjs path/to/thesis_audio.json french');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputFile);
  const languageFolder = path.join('public', targetLanguage.toLowerCase());
  await fs.mkdir(languageFolder, { recursive: true });

  const outputJsonPath = path.join(languageFolder, path.basename(inputPath, '.json') + '_translated.json');
  const outputAudioPath = path.join(languageFolder, path.basename(inputPath, '.json') + '_' + targetLanguage.toLowerCase() + '.mp3');

  try {
    const { fullTranscription } = await readJsonFile(inputPath);

    if (!fullTranscription) {
      console.error('No fullTranscription found in the input file.');
      process.exit(1);
    }

    console.log('Translating...');
    const translatedText = await translateText(fullTranscription, targetLanguage);

    await writeJsonFile(outputJsonPath, { translatedTranscription: translatedText });
    console.log(`Translation complete. Output saved to ${outputJsonPath}`);

    console.log('Synthesizing speech...');
    await createAudioFileFromText(translatedText, outputAudioPath);
    console.log(`Speech synthesis complete. Audio saved to ${outputAudioPath}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();