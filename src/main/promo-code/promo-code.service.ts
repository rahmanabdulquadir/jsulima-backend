// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreatePromoCodeDto, UpdatePromoCodeDto } from './promo-code.dto';


// @Injectable()
// export class PromoCodeService {
//   constructor(private prisma: PrismaService) {}

//   create(dto: CreatePromoCodeDto) {
//     return this.prisma.promoCode.create({ data: dto });
//   }

//   findAll() {
//     return this.prisma.promoCode.findMany({ include: { user: true } });
//   }

//   findOne(id: string) {
//     return this.prisma.promoCode.findUnique({ where: { id }, include: { user: true } });
//   }

//   update(id: string, dto: UpdatePromoCodeDto) {
//     return this.prisma.promoCode.update({ where: { id }, data: dto });
//   }

//   remove(id: string) {
//     return this.prisma.promoCode.delete({ where: { id } });
//   }
// }





import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './promo-code.dto';


@Injectable()
export class PromoCodeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromoCodeDto) {
    return this.prisma.promoCode.create({ data: dto });
  }

  async findAll() {
    return this.prisma.promoCode.findMany({
      include: { usedBy: true, user: true },
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { id },
      include: { usedBy: true, user: true },
    });

    if (!promo) throw new NotFoundException('Promo code not found');
    return promo;
  }

  async update(id: string, dto: UpdatePromoCodeDto) {
    return this.prisma.promoCode.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.promoCode.delete({
      where: { id },
    });
  }

  async validatePromoCode(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });
  
    if (!promo) throw new NotFoundException('Promo code not found');
  
    const now = new Date();
    const expired = new Date(promo.expiresAt) < now;
  
    return {
      valid: !expired,
      discountAmount: !expired ? promo.discount : 0, // <- Add this
      promo,
      message: expired ? 'Promo code expired' : 'Promo code is valid',
    };
  }
}
