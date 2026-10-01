import { RateError } from '@/services/providers/types';
import type { BackgroundRequest, BackgroundResponses, Result } from '@/types/messages';
import type { RateErrorCode } from '@/types/exchange-rate';
import { historyService, rateService, settingsService } from './services';

type Handler<R extends BackgroundRequest> = (request: R) => Promise<BackgroundResponses[R['type']]>;

const handlers: { [K in BackgroundRequest['type']]: Handler<Extract<BackgroundRequest, { type: K }>> } = {
  'currio/convert': (request) =>
    attempt(async () => {
      const to = request.to ?? (await settingsService.get()).preferredCurrency;
      const conversion = await rateService.convert(request.amount, request.from, to);
      // Popup's "Recent conversion". Numbers only; never page text or URL.
      void historyService.record(conversion).catch(() => undefined);
      return conversion;
    }),
  'currio/rate': (request) => attempt(() => rateService.getExchangeRate(request.from, request.to)),
  'currio/rate-status': () => attempt(() => rateService.getStatus()),
  'currio/refresh-rates': () => attempt(() => rateService.refresh(true)),
};

export function handleRequest(request: BackgroundRequest): Promise<unknown> {
  const handler = handlers[request.type] as Handler<BackgroundRequest>;
  return handler(request);
}

async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    const code: RateErrorCode = error instanceof RateError ? error.code : 'provider-error';
    if (!(error instanceof RateError)) console.error('[Currio]', error);
    return { ok: false, error: code };
  }
}
