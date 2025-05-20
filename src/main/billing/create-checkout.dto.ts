import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({example: 'waefwergewthtrg'})
  @IsString()
  planId: string;

  @ApiProperty({example: '100'})
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'DISCOUNT10' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
