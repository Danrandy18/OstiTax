import { Controller, Get, Query } from '@nestjs/common';
import { OpenBankingService } from './open-banking.service';

/**
 * Sin AccountAuthGuard a proposito: GoCardless redirige al navegador aqui
 * (via la pagina Angular /banking/callback, que llama a este endpoint) con
 * solo el `?ref=` como correlacion -- no hay JWT en ese momento. Se resuelve
 * todo por el `reference` unico guardado en BankConnection, mismo patron que
 * los webhook controllers de Stripe/PayPal (sin guard, al lado del
 * controller protegido).
 */
@Controller('open-banking/callback')
export class OpenBankingCallbackController {
  constructor(private readonly openBankingService: OpenBankingService) {}

  @Get()
  completeLink(@Query('ref') ref: string) {
    return this.openBankingService.completeLink(ref);
  }
}
