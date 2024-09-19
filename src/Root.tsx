import {Composition, staticFile} from 'remotion';
import {useState, useCallback} from 'react';
import {
	CaptionedVideo,
	calculateCaptionedVideoMetadata,
	captionedVideoSchema,
} from './CaptionedVideo';
import {AudioSelector} from './AudioSelector';

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
	const [selectedAudio, setSelectedAudio] = useState(staticFile('thesis_audio.wav'));

	const handleAudioSelect = useCallback((src: string) => {
		setSelectedAudio(src);
	}, []);

	return (
		<>
			<AudioSelector onSelectAudio={handleAudioSelect} />
			<Composition
				id="CaptionedVideo"
				component={CaptionedVideo}
				calculateMetadata={calculateCaptionedVideoMetadata}
				schema={captionedVideoSchema}
				width={1920}
				height={1080}
				defaultProps={{
					src: staticFile('sample-video.mp4'),
					audioSrc: selectedAudio,
				}}
			/>
		</>
	);
};
