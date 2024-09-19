# TikTok-Style Video Generator

This repository contains a tool that allows you to create TikTok-style videos with captions from audio input. It's perfect for transforming podcasts or other audio content into engaging, shareable videos for social media platforms.

## Features

- Generate captions for audio files using Whisper.cpp
- Translate captions and synthesize audio in multiple languages
- Create TikTok-style videos with animated captions
- Preview videos in Remotion Studio
- Render final videos for sharing

## Prerequisites

- Node.js (v14 or later)
- npm

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/tiktok-style-video-generator.git
   cd tiktok-style-video-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up API keys:
   Create a `.env.local` file in the root directory and add your API keys:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   CROSSHATCH_API_KEY=your_crosshatch_api_key
   ```
   You can obtain these keys from the respective websites.

## Usage

### Generating Captions

To transcribe audio and generate captions:

```
node sub.mjs public/my_podcast.mp3 --lang en
```
This will create a JSON file with the transcription in the `public` folder.

### Translating and Synthesizing Audio

To translate the English transcript and synthesize audio in another language:

```
node translate.mjs path_to_generated_transcript.json target_language
```

For example:

```
node translate.mjs public/my_podcast.json german
```

This will create translated captions and synthesized audio in the `public/german` folder.

### Previewing the Video

To preview the video in Remotion Studio:

```
npm start
```

This will open the Remotion Studio in your default browser. You can select different audio/caption combinations using the dropdown menu in the studio.

### Rendering the Final Video

To render the final video:

```
npm run build
```

The rendered video will be saved in the `out` directory.

## Configuring Whisper.cpp

The captioning process uses Whisper.cpp with the 'medium' model (1.5GB). You can configure the model and other settings in the `whisper-config.mjs` file.

## Project Structure

- `src/`: Contains the main React components and Remotion compositions
- `public/`: Stores audio files, generated transcripts, and translated assets
- `sub.mjs`: Script for generating captions using Whisper.cpp
- `translate.mjs`: Script for translating captions and synthesizing audio
- `whisper-config.mjs`: Configuration for Whisper.cpp

## Key Components

- `CaptionedVideo`: Main component for rendering the video with captions
- `Subtitle`: Component for rendering individual subtitles
- `Word`: Component for rendering and animating individual words

## Customization

You can customize the video appearance by modifying the components in the `src/CaptionedVideo/` directory. The `Word` component is particularly important for styling the captions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Remotion](https://www.remotion.dev/) for the video rendering framework
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) for speech recognition
- [ElevenLabs](https://elevenlabs.io/) for text-to-speech synthesis
- [Crosshatch](https://www.crosshatch.app/) for an easy-to-use API for LLMs.