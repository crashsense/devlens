import type { DevLensSession } from './types';
import { downloadFile } from '../export';

const FILE_EXTENSION = '.devlens';
const MIME_TYPE = 'application/json';

export function exportSession(session: DevLensSession): void {
  const json = JSON.stringify(session, null, 2);
  const filename = `devlens-session-${session.sessionId}-${Date.now()}${FILE_EXTENSION}`;
  downloadFile(json, filename, MIME_TYPE);
}

export function serializeSession(session: DevLensSession): string {
  return JSON.stringify(session, null, 2);
}
