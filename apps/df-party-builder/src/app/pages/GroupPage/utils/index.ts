import type { CharacterData } from '../../../types/types';

export const getCharacterDataFromDragEvent = (event: React.DragEvent): CharacterData | null => {
  console.log('event.dataTransfer', event.dataTransfer);
  if (!event.dataTransfer) return null;

  const type = event.dataTransfer.getData('type');
  if (type !== 'character') return null;

  const characterData = event.dataTransfer.getData('character');
  if (!characterData) return null;

  return JSON.parse(characterData) as CharacterData;
};
