import { CursorGlow } from './components/CursorGlow';
import { RotatePrompt } from './components/RotatePrompt';
import { SoundControl } from './components/SoundControl';
import { VisualNovel } from './components/VisualNovel';

export function App() {
  return (
    <>
      <VisualNovel />
      <SoundControl />
      <CursorGlow />
      <RotatePrompt />
    </>
  );
}
