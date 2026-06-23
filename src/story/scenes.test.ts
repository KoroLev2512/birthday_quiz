import { describe, it, expect } from 'vitest';
import { story, getSceneById, getStartScene, getPrevSceneId, sceneMenu } from './scenes';

describe('story integrity', () => {
  const ids = new Set(story.scenes.map((s) => s.id));

  it('start scene exists and matches startSceneId', () => {
    expect(ids.has(story.startSceneId)).toBe(true);
    expect(getStartScene()?.id).toBe(story.startSceneId);
  });

  it('scene ids are unique', () => {
    expect(ids.size).toBe(story.scenes.length);
  });

  it('every nextSceneId points to an existing scene', () => {
    const broken = story.scenes
      .filter((s) => s.nextSceneId && !ids.has(s.nextSceneId))
      .map((s) => `${s.id} → ${s.nextSceneId}`);
    expect(broken).toEqual([]);
  });

  it('every choice / button target points to an existing scene', () => {
    const broken: string[] = [];
    for (const s of story.scenes) {
      for (const c of s.choices ?? []) {
        if (c.nextSceneId && !ids.has(c.nextSceneId)) broken.push(`${s.id} choice → ${c.nextSceneId}`);
      }
      if (s.button && !ids.has(s.button.nextSceneId)) {
        broken.push(`${s.id} button → ${s.button.nextSceneId}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('every menu entry resolves to a scene', () => {
    for (const m of sceneMenu) expect(ids.has(m.firstId)).toBe(true);
  });
});

describe('scene lookups', () => {
  it('getSceneById returns scene or undefined', () => {
    expect(getSceneById(story.startSceneId)?.id).toBe(story.startSceneId);
    expect(getSceneById('does-not-exist')).toBeUndefined();
  });

  it('getPrevSceneId returns the previous scene in order', () => {
    const [first, second] = story.scenes;
    expect(getPrevSceneId(second.id)).toBe(first.id);
    expect(getPrevSceneId(first.id)).toBeUndefined();
    expect(getPrevSceneId(undefined)).toBeUndefined();
  });
});
