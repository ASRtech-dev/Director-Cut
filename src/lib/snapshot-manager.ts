import { writeTextFile, readTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

export async function saveSnapshot(
  episodeCode: string, 
  stepNumber: number, 
  artifactType: string, 
  version: number, 
  content: string
): Promise<string> {
  const versionStr = version.toString().padStart(3, '0');
  const filename = `EP${episodeCode}_S${stepNumber.toString().padStart(2, '0')}_${artifactType}_v${versionStr}.md`;
  
  const relativeDir = `episodes/EP${episodeCode}/S${stepNumber.toString().padStart(2, '0')}`;
  const relativePath = `${relativeDir}/${filename}`;

  const syncEnabled = localStorage.getItem('serverSyncEnabled') === 'true';
  const serverUrl = localStorage.getItem('serverUrl') || 'http://localhost:5000';

  if (syncEnabled) {
    try {
      const normalizedUrl = serverUrl.replace(/\/$/, '');
      const authToken = localStorage.getItem('serverAuthToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${normalizedUrl}/api/snapshots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ path: relativePath, content })
      });
      if (!res.ok) {
        throw new Error(`Failed to save snapshot to server: ${res.statusText}`);
      }
      return relativePath;
    } catch (err) {
      console.error("[SnapshotManager] Remote save failed, falling back to path definition:", err);
      return relativePath;
    }
  }
  
  try {
    const localDir = `snapshots/episodes/EP${episodeCode}/S${stepNumber.toString().padStart(2, '0')}`;
    const localPath = `${localDir}/${filename}`;

    if (!(await exists('snapshots', { baseDir: BaseDirectory.AppLocalData }))) {
      await mkdir('snapshots', { baseDir: BaseDirectory.AppLocalData, recursive: true });
    }
    if (!(await exists(localDir, { baseDir: BaseDirectory.AppLocalData }))) {
      await mkdir(localDir, { baseDir: BaseDirectory.AppLocalData, recursive: true });
    }
    
    await writeTextFile(localPath, content, { baseDir: BaseDirectory.AppLocalData });
    console.log(`[SnapshotManager] Saved local: ${localPath}`);
    return localPath;
  } catch (err) {
    console.error("Failed to save local snapshot:", err);
    return relativePath;
  }
}

export async function readSnapshot(path: string): Promise<string> {
  const syncEnabled = localStorage.getItem('serverSyncEnabled') === 'true';
  const serverUrl = localStorage.getItem('serverUrl') || 'http://localhost:5000';

  if (syncEnabled) {
    try {
      const normalizedUrl = serverUrl.replace(/\/$/, '');
      const authToken = localStorage.getItem('serverAuthToken');
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${normalizedUrl}/api/snapshots?path=${encodeURIComponent(path)}`, {
        headers,
      });
      if (!res.ok) {
        throw new Error(`Failed to read snapshot from server: ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      console.error("[SnapshotManager] Remote read failed:", err);
      return "Failed to load snapshot from server.";
    }
  }

  try {
    return await readTextFile(path, { baseDir: BaseDirectory.AppLocalData });
  } catch (err) {
    console.error("Failed to read local snapshot:", err);
    return "Failed to load snapshot.";
  }
}
