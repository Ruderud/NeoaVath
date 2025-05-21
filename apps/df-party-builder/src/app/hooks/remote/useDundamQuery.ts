import { useQuery } from '@tanstack/react-query';
import { getDundamData } from '../../api/dundam';
import type { CharacterData } from '../../api/dundam';

export const useDundamQuery = (name: string, type: 'character' | 'adventure') =>
  useQuery<{ characters: CharacterData[]; total: number }>({
    queryKey: ['dundam', name, type],
    queryFn: () => getDundamData({ name, type }),
    enabled: name.length > 0,
    staleTime: 1000 * 60 * 5,
  });
