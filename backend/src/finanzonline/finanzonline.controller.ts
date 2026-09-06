import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AccountAuthGuard } from '../auth/guards/account-auth.guard';
import { SubmitDeclarationDto } from './dto/submit-declaration.dto';
import { FinanzOnlineService } from './finanzonline.service';

@Controller('finanzonline')
@UseGuards(AccountAuthGuard)
export class FinanzOnlineController {
  constructor(private readonly finanzOnlineService: FinanzOnlineService) {}

  @Post('submit')
  submit(@Body() dto: SubmitDeclarationDto) {
    return this.finanzOnlineService.submitDeclaration(dto.declaration);
  }
}
