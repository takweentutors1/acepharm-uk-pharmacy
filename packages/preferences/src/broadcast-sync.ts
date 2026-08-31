import { usePreferences, PreferencesState } from './store';

/**
 * Enables multi-tab synchronization using the BroadcastChannel API.
 */
export function enableTabSync() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {};
  }

  const channel = new BroadcastChannel('acepharm_preferences_channel');

  channel.onmessage = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_PREFERENCES' && event.data?.payload) {
      usePreferences.setState(event.data.payload);
    }
  };

  const unsubscribe = usePreferences.subscribe((state: PreferencesState) => {
    channel.postMessage({
      type: 'SYNC_PREFERENCES',
      payload: {
        theme: state.theme,
        readerMode: state.readerMode,
        examSettings: state.examSettings,
        cookieConsent: state.cookieConsent,
      },
    });
  });

  return () => {
    unsubscribe();
    channel.close();
  };
}
