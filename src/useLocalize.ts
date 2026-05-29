import { useAppSelector } from './redux/hooks';

/**
 * Returns the localized string for the given key, falling back to the provided
 * English default when the localization manager is not yet available or the key
 * is not found.
 */
export function useLocalize(key: string, fallback: string): string {
    const mgr = useAppSelector(state => state.options.localizationManager);
    if (!mgr) return fallback;
    const value = mgr.getDisplayName(key);
    return value || fallback;
}
