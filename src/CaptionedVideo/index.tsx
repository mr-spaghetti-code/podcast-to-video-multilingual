import {useCallback, useEffect, useState} from 'react';
import {
	AbsoluteFill,
	Audio,
	CalculateMetadataFunction,
	cancelRender,
	continueRender,
	delayRender,
	getStaticFiles,
	OffthreadVideo,
	Sequence,
	useVideoConfig,
	watchStaticFile,
} from 'remotion';
import {z} from 'zod';
import Subtitle from './Subtitle';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {loadFont} from '../load-font';
import {NoCaptionFile} from './NoCaptionFile';

export type SubtitleProp = {
	startInSeconds: number;
	text: string;
};

export const captionedVideoSchema = z.object({
	src: z.string(),
	audioSrc: z.string(),
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
	z.infer<typeof captionedVideoSchema>
> = async ({props}) => {
	const fps = 30;
	const audioMetadata = await getAudioDurationInSeconds(props.audioSrc);
	return {
		fps,
		durationInFrames: Math.ceil(audioMetadata * fps),
	};
};

const getFileExists = (file: string) => {
	const files = getStaticFiles();
	const fileExists = files.find((f) => {
		return f.src === file;
	});
	return Boolean(fileExists);
};

export const CaptionedVideo: React.FC<{
	src: string;
	audioSrc: string;
}> = ({src, audioSrc}) => {
	const [subtitles, setSubtitles] = useState<SubtitleProp[]>([]);
	const [handle] = useState(() => delayRender());
	const [audioDuration, setAudioDuration] = useState(0);
	const {fps} = useVideoConfig();

	const subtitlesFile = audioSrc
		.replace(/.wav$/, '.json')
		.replace(/.mp3$/, '.json');

	const fetchSubtitles = useCallback(async () => {
		try {
			await loadFont();
			const res = await fetch(subtitlesFile);
			const data = await res.json();
			setSubtitles(data.transcription);
			const duration = await getAudioDurationInSeconds(audioSrc);
			setAudioDuration(duration);
			continueRender(handle);
		} catch (e) {
			cancelRender(e);
		}
	}, [handle, subtitlesFile, audioSrc]);

	useEffect(() => {
		fetchSubtitles();

		const c = watchStaticFile(subtitlesFile, () => {
			fetchSubtitles();
		});

		return () => {
			c.cancel();
		};
	}, [fetchSubtitles, audioSrc, subtitlesFile]);

	const durationInFrames = Math.ceil(audioDuration * fps);

	return (
		<AbsoluteFill style={{backgroundColor: 'white'}}>
			<AbsoluteFill>
				<OffthreadVideo
					style={{
						objectFit: 'cover',
					}}
					src={src}
					muted
					loop
				/>
				<Audio src={audioSrc} />
			</AbsoluteFill>
			{subtitles.map((subtitle, index) => {
				const nextSubtitle = subtitles[index + 1] ?? null;
				const subtitleStartFrame = subtitle.startInSeconds * fps;
				const subtitleEndFrame = Math.min(
					nextSubtitle ? nextSubtitle.startInSeconds * fps : Infinity,
					subtitleStartFrame + fps,
					durationInFrames
				);
				const subtitleDurationInFrames = subtitleEndFrame - subtitleStartFrame;
				if (subtitleDurationInFrames <= 0) {
					return null;
				}

				return (
					<Sequence
						from={subtitleStartFrame}
						durationInFrames={subtitleDurationInFrames}
						key={index}
					>
						<Subtitle text={subtitle.text} />
					</Sequence>
				);
			})}
			{getFileExists(subtitlesFile) ? null : <NoCaptionFile />}
		</AbsoluteFill>
	);
};
