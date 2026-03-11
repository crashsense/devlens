import type { DevLensSession } from './types';

export interface ImportResult {
  success: boolean;
  session: DevLensSession | null;
  error: string | null;
}

function isValidSession(data: unknown): data is DevLensSession {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.version === '1.0' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.exportedAt === 'string' &&
    typeof obj.metadata === 'object' &&
    Array.isArray(obj.timeline) &&
    Array.isArray(obj.issues)
  );
}

export function parseSessionFile(content: string): ImportResult {
  try {
    const data: unknown = JSON.parse(content);
    if (!isValidSession(data)) {
      return { success: false, session: null, error: 'Invalid .devlens file format' };
    }
    return { success: true, session: data, error: null };
  } catch {
    return { success: false, session: null, error: 'Failed to parse JSON' };
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
