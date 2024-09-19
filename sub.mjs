import {execSync} from 'node:child_process';
import {
	existsSync,
	rmSync,
	writeFileSync,
	lstatSync,
	mkdirSync,
	readdirSync,
} from 'node:fs';
import path from 'path';
import {
	WHISPER_MODEL,
	WHISPER_PATH,
	WHISPER_VERSION,
} from './whisper-config.mjs';
import {
	convertToCaptions,
	downloadWhisperModel,
	installWhisperCpp,
	transcribe,
} from '@remotion/install-whisper-cpp';

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.indexOf('--lang');
const WHISPER_LANG = langIndex !== -1 && args[langIndex + 1] ? args[langIndex + 1] : 'en';

// Remove --lang and its value from args if present
if (langIndex !== -1) {
  args.splice(langIndex, 2);
}

const convertCaptionsToParagraphs = (transcription) => {
  return transcription.map(item => item.text).join(' ');
};

const extractToTempAudioFile = (fileToTranscribe, tempOutFile) => {
	// Extracting audio from video or copying audio file and save it as 16khz wav file
	execSync(
		`npx remotion ffmpeg -i ${fileToTranscribe} -ar 16000 ${tempOutFile} -y`,
		{stdio: ['ignore', 'inherit']},
	);
};

const subFile = async (filePath, fileName, folder) => {
	const outPath = path.join(
		process.cwd(),
		'public',
		folder,
		path.basename(fileName, path.extname(fileName)) + '.json'
	);

	const result = await transcribe({
		inputPath: filePath,
		model: WHISPER_MODEL,
		tokenLevelTimestamps: true,
		whisperPath: WHISPER_PATH,
		printOutput: false,
		translateToEnglish: false,
		language: WHISPER_LANG,
	});

	const {captions} = convertToCaptions({
		transcription: result.transcription,
		combineTokensWithinMilliseconds: 200,
	});

  const fullTranscript = convertCaptionsToParagraphs(result.transcription);

	writeFileSync(
		outPath,
		JSON.stringify(
			{
				...result,
				transcription: captions,
				fullTranscription: fullTranscript,
			},
			null,
			2,
		),
	);
};

const processFile = async (fullPath, entry, directory) => {
	const supportedExtensions = ['.mp4', '.webm', '.mkv', '.mov', '.mp3', '.wav'];
	const fileExtension = path.extname(fullPath).toLowerCase();

	if (!supportedExtensions.includes(fileExtension)) {
		return;
	}

	const isTranscribed = existsSync(
		fullPath.replace(new RegExp(`${fileExtension}$`), '.json')
	);
	if (isTranscribed) {
		return;
	}
	let shouldRemoveTempDirectory = false;
	if (!existsSync(path.join(process.cwd(), 'temp'))) {
		mkdirSync(`temp`);
		shouldRemoveTempDirectory = true;
	}
	console.log('Processing file', entry);

	const tempWavFileName = path.basename(entry, path.extname(entry)) + '.wav';
	const tempOutFilePath = path.join(process.cwd(), `temp/${tempWavFileName}`);

	extractToTempAudioFile(fullPath, tempOutFilePath);
	await subFile(
		tempOutFilePath,
		tempWavFileName,
		path.relative('public', directory),
	);
	if (shouldRemoveTempDirectory) {
		rmSync(path.join(process.cwd(), 'temp'), {recursive: true});
	}
};

const processDirectory = async (directory) => {
	const entries = readdirSync(directory).filter((f) => f !== '.DS_Store');

	for (const entry of entries) {
		const fullPath = path.join(directory, entry);
		const stat = lstatSync(fullPath);

		if (stat.isDirectory()) {
			await processDirectory(fullPath); // Recurse into subdirectories
		} else {
			await processFile(fullPath, entry, directory);
		}
	}
};

// await installWhisperCpp({to: WHISPER_PATH, version: WHISPER_VERSION});
// await downloadWhisperModel({folder: WHISPER_PATH, model: WHISPER_MODEL});

// Read arguments for filename if given else process all files in the directory
const hasArgs = args.length > 0;

if (!hasArgs) {
	await processDirectory(path.join(process.cwd(), 'public'));
	process.exit(0);
}

for (const arg of args) {
	const fullPath = path.join(process.cwd(), arg);
	const stat = lstatSync(fullPath);

	if (stat.isDirectory()) {
		await processDirectory(fullPath);
		continue;
	}

	console.log(`Processing file ${fullPath}`);
	const directory = path.dirname(fullPath);
	const fileName = path.basename(fullPath);
	await processFile(fullPath, fileName, directory);
}