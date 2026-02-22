import { createContext } from 'react';
import type { DevLensEngine } from '@devlens/core';

export const DevLensContext = createContext<DevLensEngine | null>(null);
