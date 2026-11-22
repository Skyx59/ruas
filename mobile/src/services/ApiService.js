import { ruasClient } from './ruasClient';
import { stepSafeClient } from './stepSafeClient';
import { healthClient } from './healthClient';
import { serviceAdapters } from './serviceAdapters';

const serviceNames = { ruas: 'RUAS', stepSafe: 'StepSafe', health: 'Health' };
const operations = {
  ruas: ['listReports', 'getReport', 'getWeather', 'recommendRoutes', 'createReport', 'confirmReport', 'login', 'register', 'logout', 'getProfile'],
  stepSafe: ['getWalkability'],
  health: ['listFacilities'],
};

export class ContractUnavailableError extends Error {
  constructor(service, operation) {
    super(`Integrasi ${serviceNames[service]} untuk ${operation} belum didukung kontrak yang tersedia (blocked). Permintaan belum dikirim.`);
    this.name = 'ContractUnavailableError';
    this.code = 'CONTRACT_UNAVAILABLE';
  }
}

export function createApiService(adapters = serviceAdapters, clients = { ruas: ruasClient, stepSafe: stepSafeClient, health: healthClient }) {
  const service = {
    hasOperation(provider, operation) {
      return typeof adapters[provider]?.[operation] === 'function';
    },
  };

  for (const [provider, names] of Object.entries(operations)) {
    service[provider] = Object.fromEntries(names.map(operation => [operation, async (input, session = null) => {
      if (!service.hasOperation(provider, operation)) throw new ContractUnavailableError(provider, operation);
      return adapters[provider][operation]({ client: clients[provider], input, session });
    }]));
  }

  return service;
}

const ApiService = createApiService();
export default ApiService;
