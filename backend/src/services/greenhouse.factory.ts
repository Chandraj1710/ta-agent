/**
 * Factory to get GreenhouseService with current API key (from UI or env)
 */

import GreenhouseService from './greenhouse.service';
import { getGreenhouseApiKey } from '../store/settings.store';

export function getGreenhouseService(): GreenhouseService {
  return new GreenhouseService(getGreenhouseApiKey());
}
