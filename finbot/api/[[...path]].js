/**
 * Точка входа для облака (Vercel).
 * Один обработчик обслуживает всё: вебхук Telegram, напоминания и API.
 */
import { createApp } from '../backend/src/app.js';

const app = createApp();

export default app;
