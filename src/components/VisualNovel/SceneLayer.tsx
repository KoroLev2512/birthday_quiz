import type { Scene, SceneEffect } from '../../types/story';

const EFFECT_CLASS: Record<SceneEffect, string> = {
  'zoom-in': 'vn-effect-zoom-in',
  'zoom-out': 'vn-effect-zoom-out',
  'pan-left': 'vn-effect-pan-left',
  'pan-right': 'vn-effect-pan-right',
};

type SceneLayerProps = {
  scene: Scene;
  onVideoEnd?: () => void;
};

export function SceneLayer({ scene, onVideoEnd }: SceneLayerProps) {
  const effectClass = scene.effect ? EFFECT_CLASS[scene.effect] : '';

  if (scene.type === 'video') {
    return (
      <video
        key={scene.id}
        src={scene.src}
        className={`absolute inset-0 h-full w-full object-cover ${effectClass}`}
        autoPlay
        playsInline
        onEnded={onVideoEnd}
        data-testid="scene-video"
      />
    );
  }

  return (
    <img
      key={scene.id}
      src={scene.src}
      alt=""
      className={`absolute inset-0 h-full w-full object-cover ${effectClass}`}
      data-testid="scene-image"
    />
  );
}
