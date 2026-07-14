export async function pullServerState(): Promise<object | null> {
  try {
    const resp = await fetch('/api/state');
    if (!resp.ok) return null;
    const state = await resp.json();
    return Object.keys(state).length > 0 ? state : null;
  } catch {
    return null;
  }
}

export async function pushServerState(state: object): Promise<boolean> {
  try {
    const resp = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export function extractStoreState(store: object): object {
  const keys = [
    'users', 'fighters', 'missions', 'roles', 'specializations',
    'vehicleTypes', 'vehicleAssociations', 'specializationAssociations',
    'syncEnabled', 'lastSyncTimestamp', 'pendingDeltas', 'offlineMode',
  ];
  const state: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in store) (state as any)[k] = (store as any)[k];
  }
  return state;
}
