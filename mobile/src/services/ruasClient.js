import { apiBaseUrls } from './config';
import { createApiClient } from './createApiClient';

export const ruasClient = createApiClient(apiBaseUrls.ruas, 'RUAS');
