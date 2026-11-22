import { apiBaseUrls } from './config';
import { createApiClient } from './createApiClient';

export const stepSafeClient = createApiClient(apiBaseUrls.stepSafe, 'StepSafe');
