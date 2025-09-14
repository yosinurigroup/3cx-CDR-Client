/**
 * Data Source Settings Service
 * - Stores user-friendly names for data sources in localStorage
 * - Provides helpers to build option lists with labels
 */

export type DataSourceKey = 'cdrs_143.198.0.104' | 'cdrs_167.71.120.52';

const STORAGE_KEY = 'dataSourceNames';

const DEFAULT_NAMES: Record<DataSourceKey, string> = {
  'cdrs_143.198.0.104': 'Option 1',
  'cdrs_167.71.120.52': 'Option 2',
};

function getIpFromValue(value: string): string {
  return value.replace(/^cdrs_/, '');
}

function readStoredNames(): Partial<Record<string, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch {
    return {};
  }
}

function writeStoredNames(names: Partial<Record<string, string>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // ignore write failures
  }
}

export function getDataSourceNames(): Record<DataSourceKey, string> {
  const saved = readStoredNames();
  return {
    'cdrs_143.198.0.104': (saved['cdrs_143.198.0.104'] || DEFAULT_NAMES['cdrs_143.198.0.104']) as string,
    'cdrs_167.71.120.52': (saved['cdrs_167.71.120.52'] || DEFAULT_NAMES['cdrs_167.71.120.52']) as string,
  };
}

export function setDataSourceName(key: DataSourceKey, name: string) {
  const trimmed = (name || '').trim();
  const current = readStoredNames();
  current[key] = trimmed || DEFAULT_NAMES[key];
  writeStoredNames(current);
}

export function setDataSourceNames(partial: Partial<Record<DataSourceKey, string>>) {
  const current = readStoredNames();
  const next: Partial<Record<string, string>> = { ...current };
  (Object.keys(partial) as DataSourceKey[]).forEach((k) => {
    const v = (partial[k] || '').trim();
    next[k] = v || DEFAULT_NAMES[k];
  });
  writeStoredNames(next);
}

export function resetDataSourceNamesToDefault() {
  writeStoredNames({
    'cdrs_143.198.0.104': DEFAULT_NAMES['cdrs_143.198.0.104'],
    'cdrs_167.71.120.52': DEFAULT_NAMES['cdrs_167.71.120.52'],
  });
}

export function getDataSourceOptions(): Array<{ value: DataSourceKey; label: string }> {
  const names = getDataSourceNames();
  return (Object.keys(names) as DataSourceKey[]).map((value) => {
    const ip = getIpFromValue(value);
    const name = names[value];
    return { value, label: `${name} (${ip})` };
  });
}

export const defaultDataSourceOrder: DataSourceKey[] = [
  'cdrs_143.198.0.104',
  'cdrs_167.71.120.52',
];