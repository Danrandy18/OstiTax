import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CalculateRequestDto } from '../../calc/dto/calculate-request.dto';

/**
 * Placeholder: los datos que se enviarian a FinanzOnline. Reutiliza el
 * mismo shape que ya usa el motor de calculo, ya que hoy no existe una
 * tabla separada de "declaraciones" persistidas.
 */
export class SubmitDeclarationDto {
  @ValidateNested()
  @Type(() => CalculateRequestDto)
  declaration!: CalculateRequestDto;
}
