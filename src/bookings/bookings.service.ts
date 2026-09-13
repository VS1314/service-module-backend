import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      const providerService = await tx.providerService.findUnique({
        where: {
          providerId_categoryId: {
            providerId: dto.providerId,
            categoryId: dto.categoryId,
          },
        },
        include: {
          provider: true,
          category: true,
        },
      });

      if (
        !providerService ||
        !providerService.isActive ||
        !providerService.provider.isActive ||
        !providerService.category.isActive
      ) {
        throw new BadRequestException(
          'Provider does not offer the selected service',
        );
      }

      const slot = await tx.providerAvailability.findUnique({
        where: {
          id: dto.availabilityId,
        },
      });

      if (!slot || !slot.isActive) {
        throw new NotFoundException('Availability slot not found');
      }

      if (slot.providerId !== dto.providerId) {
        throw new BadRequestException(
          'Availability slot does not belong to this provider',
        );
      }

      const reserved = await tx.providerAvailability.updateMany({
        where: {
          id: dto.availabilityId,
          providerId: dto.providerId,
          isActive: true,
          isBooked: false,
        },
        data: {
          isBooked: true,
        },
      });

      if (reserved.count !== 1) {
        throw new ConflictException('SLOT_NOT_AVAILABLE');
      }

      return tx.serviceBooking.create({
        data: {
          userId: dto.userId,
          providerId: dto.providerId,
          categoryId: dto.categoryId,
          availabilityId: slot.id,
          sourceAddressId: dto.sourceAddressId,
          bookingDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,

          addressSnapshot: {
            create: {
              fullName: dto.address.fullName,
              phoneNumber: dto.address.phoneNumber,
              alternativePhone: dto.address.alternativePhone,
              pincode: dto.address.pincode,
              state: dto.address.state,
              city: dto.address.city,
              houseBuilding: dto.address.houseBuilding,
              roadAreaColony: dto.address.roadAreaColony,
              landmark: dto.address.landmark,
            },
          },

          statusHistory: {
            create: {
              status: 'PENDING',
            },
          },
        },

        include: {
          provider: true,
          category: true,
          addressSnapshot: true,
          statusHistory: true,
        },
      });
    });
  }

  findAll(userId: string) {
    return this.prisma.serviceBooking.findMany({
      where: {
        userId,
      },
      include: {
        provider: true,
        category: true,
        addressSnapshot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(bookingId: number, userId: string) {
    const booking = await this.prisma.serviceBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        provider: true,
        category: true,
        addressSnapshot: true,
        statusHistory: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async cancel(bookingId: number, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.serviceBooking.findFirst({
        where: {
          id: bookingId,
          userId,
        },
        select: {
          id: true,
          status: true,
          availabilityId: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const cancelled = await tx.serviceBooking.updateMany({
        where: {
          id: bookingId,
          userId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      if (cancelled.count !== 1) {
        const currentBooking = await tx.serviceBooking.findUnique({
          where: {
            id: bookingId,
          },
          select: {
            status: true,
          },
        });

        throw new BadRequestException(
          `Booking with status ${
            currentBooking?.status ?? booking.status
          } cannot be cancelled`,
        );
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'CANCELLED',
        },
      });

      await tx.providerAvailability.update({
        where: {
          id: booking.availabilityId,
        },
        data: {
          isBooked: false,
        },
      });

      const updatedBooking = await tx.serviceBooking.findUnique({
        where: {
          id: bookingId,
        },
        include: {
          provider: true,
          category: true,
          addressSnapshot: true,
          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!updatedBooking) {
        throw new NotFoundException('Booking not found');
      }

      return updatedBooking;
    });
  }
}
