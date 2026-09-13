import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

type ProviderSort = 'rating_desc' | 'rating_asc' | 'discount_desc' | 'newest';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    q?: string,
    categoryId?: number,
    minRating?: number,
    minDiscount?: number,
    sort: ProviderSort = 'rating_desc',
    page = 1,
    limit = 40,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      provider: {
        isActive: true,
        ...(minRating !== undefined
          ? {
              averageRating: {
                gte: minRating,
              },
            }
          : {}),
      },
      category: {
        isActive: true,
      },
      ...(categoryId !== undefined
        ? {
            categoryId,
          }
        : {}),
      ...(minDiscount !== undefined
        ? {
            discountPercent: {
              gte: minDiscount,
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              {
                displayTitle: {
                  contains: q,
                  mode: 'insensitive' as const,
                },
              },
              {
                provider: {
                  fullName: {
                    contains: q,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                category: {
                  name: {
                    contains: q,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const orderBy = this.getOrderBy(sort);

    const [items, total] = await Promise.all([
      this.prisma.providerService.findMany({
        where,
        include: {
          provider: true,
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.providerService.count({
        where,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(providerId: number) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: providerId,
      },
      include: {
        services: {
          where: {
            isActive: true,
            category: {
              isActive: true,
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    if (!provider || !provider.isActive) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  async getAvailability(providerId: number, date: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: providerId,
      },
    });

    if (!provider || !provider.isActive) {
      throw new NotFoundException('Provider not found');
    }

    const slotDate = new Date(`${date}T00:00:00.000Z`);

    const slots = await this.prisma.providerAvailability.findMany({
      where: {
        providerId,
        date: slotDate,
        isActive: true,
        isBooked: false,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return {
      providerId,
      date,
      slots,
    };
  }

  private getOrderBy(sort: ProviderSort) {
    switch (sort) {
      case 'rating_asc':
        return [
          {
            provider: {
              averageRating: 'asc' as const,
            },
          },
          {
            id: 'asc' as const,
          },
        ];

      case 'discount_desc':
        return [
          {
            discountPercent: {
              sort: 'desc' as const,
              nulls: 'last' as const,
            },
          },
          {
            id: 'asc' as const,
          },
        ];

      case 'newest':
        return [
          {
            createdAt: 'desc' as const,
          },
          {
            id: 'desc' as const,
          },
        ];

      case 'rating_desc':
      default:
        return [
          {
            provider: {
              averageRating: 'desc' as const,
            },
          },
          {
            id: 'asc' as const,
          },
        ];
    }
  }
}
