import handlerCore from './_askAynaCore.js';
import { quotaAwareResponse } from './_proQuotaResponse.js';

export default function handler(req, res) {
  return handlerCore(req, quotaAwareResponse(res, { askAyna: true }));
}
