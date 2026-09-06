import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CalculateRequestDto } from '../calc/dto/calculate-request.dto';

/**
 * Integracion pendiente de certificacion oficial ante el BMF
 * (Bundesministerium fuer Finanzen). FinanzOnline no ofrece una API publica
 * de autoservicio: hay que registrarse como transmisor de datos autorizado
 * (webservice SOAP de FinanzOnline con Teilnehmer-ID/Benutzer-ID/PIN). Ver
 * README para el proceso completo.
 *
 * Este servicio queda listo para conectar el cliente SOAP real en cuanto se
 * tengan las credenciales aprobadas -- por ahora solo valida configuracion
 * y devuelve un error claro, mismo patron que StripeBillingService cuando
 * falta STRIPE_SECRET_KEY.
 */
@Injectable()
export class FinanzOnlineService {
  constructor(private readonly configService: ConfigService) {}

  async submitDeclaration(
    _declaration: CalculateRequestDto,
  ): Promise<{ submissionId: string }> {
    const enabled = this.configService.get<boolean>('finanzonline.enabled');

    if (!enabled) {
      throw new ServiceUnavailableException({
        code: 'FINANZONLINE_NOT_CONFIGURED',
        message:
          'La integracion con FinanzOnline aun no esta certificada por el BMF. Mientras tanto, exporta el PDF y cargalo manualmente en FinanzOnline.',
      });
    }

    // TODO: una vez aprobada la certificacion del BMF, implementar aqui el
    // cliente SOAP del webservice de FinanzOnline usando
    // finanzonline.webserviceUrl / teilnehmerId / benutzerId / pin (ver
    // backend/src/config/finanzonline.config.ts).
    throw new ServiceUnavailableException({
      code: 'FINANZONLINE_NOT_IMPLEMENTED',
      message: 'El envio directo a FinanzOnline todavia no esta implementado.',
    });
  }
}
