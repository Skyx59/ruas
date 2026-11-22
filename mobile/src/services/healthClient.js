import { apiBaseUrls } from './config';
import { createApiClient } from './createApiClient';

export const healthClient = createApiClient(apiBaseUrls.health, 'Health');
