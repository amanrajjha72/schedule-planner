import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createDarkTheme, createLightTheme, FluentProvider, type BrandVariants, type Theme } from '@fluentui/react-components';

type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeContextValue { mode: ThemeMode; setMode(mode: ThemeMode): void }
const ThemeContext = createContext<ThemeContextValue | null>(null);

const palette = {
  primary: '#126B5B',
  accent: '#D56545',
  surface: '#F5F7F3',
  raised: '#FFFFFF',
  text: '#1E302B',
  muted: '#61716B',
  border: '#D5DED6',
};

function mixHex(color: string, target: number, amount: number): string {
  const value = Number.parseInt(color.slice(1), 16);
  const source = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const mixed = source.map((channel) => Math.round(channel + (target - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

const rampColors = [
  mixHex(palette.primary, 255, 0.94), mixHex(palette.primary, 255, 0.88),
  mixHex(palette.primary, 255, 0.78), mixHex(palette.primary, 255, 0.68),
  mixHex(palette.primary, 255, 0.56), mixHex(palette.primary, 255, 0.44),
  mixHex(palette.primary, 255, 0.32), mixHex(palette.primary, 255, 0.20),
  mixHex(palette.primary, 255, 0.10), palette.primary,
  mixHex(palette.primary, 0, 0.12), mixHex(palette.primary, 0, 0.24),
  mixHex(palette.primary, 0, 0.36), mixHex(palette.primary, 0, 0.48),
  mixHex(palette.primary, 0, 0.60), mixHex(palette.primary, 0, 0.72),
];

const brandRamp = Object.fromEntries(rampColors.map((color, index) => [(index + 1) * 10, color])) as BrandVariants;
const lightBase = createLightTheme(brandRamp);
const darkBase = createDarkTheme(brandRamp);

const lightTheme: Theme = {
  ...lightBase,
  colorNeutralBackground1: palette.raised,
  colorNeutralBackground2: palette.surface,
  colorNeutralBackground3: '#E9EEE8',
  colorNeutralForeground1: palette.text,
  colorNeutralForeground2: palette.muted,
  colorNeutralStroke1: palette.border,
  colorNeutralStroke2: '#E3E9E2',
  fontFamilyBase: '"Source Sans 3", Aptos, "Segoe UI", sans-serif',
  fontFamilyNumeric: '"Source Sans 3", Aptos, "Segoe UI", sans-serif',
};

const darkTheme: Theme = {
  ...darkBase,
  colorNeutralBackground1: '#18201D',
  colorNeutralBackground2: '#202A26',
  colorNeutralBackground3: '#29352F',
  colorNeutralForeground1: '#EDF3EE',
  colorNeutralForeground2: '#AFBDB4',
  colorNeutralStroke1: '#3B4941',
  colorNeutralStroke2: '#303C35',
  fontFamilyBase: '"Source Sans 3", Aptos, "Segoe UI", sans-serif',
  fontFamilyNumeric: '"Source Sans 3", Aptos, "Segoe UI", sans-serif',
};

function systemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeRoot({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem('app-theme');
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });
  const [systemDark, setSystemDark] = useState(systemIsDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  const value = useMemo(() => ({
    mode,
    setMode(next: ThemeMode) {
      window.localStorage.setItem('app-theme', next);
      setMode(next);
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <FluentProvider theme={isDark ? darkTheme : lightTheme} className={isDark ? 'app-fluent app-fluent--dark' : 'app-fluent'}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeRoot.');
  return context;
}

export { palette };