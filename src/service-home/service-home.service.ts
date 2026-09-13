import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class ServiceHomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [categories, promotions, topServices] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      }),

      this.prisma.servicePromotion.findMany({
        where: {
          isActive: true,
        },
        include: {
          category: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      }),

      this.prisma.providerService.findMany({
        where: {
          isActive: true,
          provider: {
            isActive: true,
          },
        },
        include: {
          provider: true,
          category: true,
        },
        orderBy: {
          provider: {
            averageRating: 'desc',
          },
        },
        take: 4,
      }),
    ]);

    return {
      categories,
      promotions,
      topServices,
    };
  }
}
