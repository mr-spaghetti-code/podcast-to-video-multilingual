import React from 'react';
import {useCallback} from 'react';
import {getStaticFiles} from 'remotion';

export const AudioSelector: React.FC<{
  onSelectAudio: (src: string) => void;
}> = ({onSelectAudio}) => {
  const audioFiles = getStaticFiles().filter((file) =>
    file.src.endsWith('.wav') || file.src.endsWith('.mp3')
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSelectAudio(e.target.value);
    },
    [onSelectAudio]
  );

  return (
    <select onChange={handleChange}>
      {audioFiles.map((file) => (
        <option key={file.src} value={file.src}>
          {file.src}
        </option>
      ))}
    </select>
  );
};