import { getRankForDays } from '../../data/rankTable';
import type { BackgroundTheme } from './BackgroundTheme';
import { makeCompanyTheme, CompanyTheme } from './CompanyTheme';
import { PoliticsTheme } from './PoliticsTheme';
import { IsekaiTheme } from './IsekaiTheme';
import { makeSpaceTheme, type SpacePlanet } from './SpaceTheme';

const SPACE_RANK_TO_PLANET: Record<string, SpacePlanet> = {
  ujuin:     'moon',
  dal:       'moon',
  hwaseong:  'mars',
  geumseong: 'venus',
  mokseong:  'jupiter',
  cheonwang: 'uranus',
};

// Cache space themes so we don't re-create objects every frame
const spaceThemeCache = new Map<SpacePlanet, BackgroundTheme>();

function getSpaceTheme(planet: SpacePlanet): BackgroundTheme {
  let theme = spaceThemeCache.get(planet);
  if (!theme) {
    theme = makeSpaceTheme(planet);
    spaceThemeCache.set(planet, theme);
  }
  return theme;
}

export function getThemeForDays(totalCompletedDays: number): BackgroundTheme {
  const rank = getRankForDays(totalCompletedDays);

  switch (rank.world) {
    case 'company':
      // Each company rank gets its own sky/weather sub-theme
      return makeCompanyTheme(rank.id);
    case 'politics':
      return PoliticsTheme;
    case 'isekai':
      return IsekaiTheme;
    case 'space': {
      const planet = SPACE_RANK_TO_PLANET[rank.id] ?? 'moon';
      return getSpaceTheme(planet);
    }
  }
}

export { CompanyTheme, makeCompanyTheme } from './CompanyTheme';
export { PoliticsTheme } from './PoliticsTheme';
export { IsekaiTheme } from './IsekaiTheme';
export { makeSpaceTheme } from './SpaceTheme';
export type { BackgroundTheme, ThemeColors } from './BackgroundTheme';
