import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingsService', () => {
  let service: BookingsService;

  const tx = {
    providerService: {
      findUnique: jest.fn(),
    },
    providerAvailability: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    serviceBooking: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    bookingStatusHistory: {
      create: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx),
    ),
    serviceBooking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const createBookingDto: CreateBookingDto = {
    userId: 'user-test',
    providerId: 1,
    categoryId: 5,
    availabilityId: 3,
    sourceAddressId: 'address-1',
    address: {
      fullName: 'Test User',
      phoneNumber: '9999999999',
      alternativePhone: '8888888888',
      pincode: '641001',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      houseBuilding: '10 Test Street',
      roadAreaColony: 'Test Area',
      landmark: 'Near Test Landmark',
    },
  };

  const providerService = {
    id: 1,
    providerId: 1,
    categoryId: 5,
    isActive: true,
    provider: {
      id: 1,
      isActive: true,
    },
    category: {
      id: 5,
      isActive: true,
    },
  };

  const slot = {
    id: 3,
    providerId: 1,
    date: new Date('2026-09-14T00:00:00.000Z'),
    startTime: '10:00',
    endTime: '11:00',
    isBooked: false,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BookingsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a booking when provider, category, and slot are valid', async () => {
      const createdBooking = {
        id: 1,
        status: 'PENDING',
        availabilityId: 3,
      };

      tx.providerService.findUnique.mockResolvedValue(providerService);
      tx.providerAvailability.findUnique.mockResolvedValue(slot);
      tx.providerAvailability.updateMany.mockResolvedValue({
        count: 1,
      });
      tx.serviceBooking.create.mockResolvedValue(createdBooking);

      const result = await service.create(createBookingDto);

      expect(result).toEqual(createdBooking);

      expect(tx.providerAvailability.updateMany).toHaveBeenCalledWith({
        where: {
          id: 3,
          providerId: 1,
          isActive: true,
          isBooked: false,
        },
        data: {
          isBooked: true,
        },
      });

      expect(tx.serviceBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-test',
            providerId: 1,
            categoryId: 5,
            availabilityId: 3,
            bookingDate: slot.date,
            startTime: '10:00',
            endTime: '11:00',
          }),
        }),
      );
    });

    it('rejects booking when the provider is inactive', async () => {
      tx.providerService.findUnique.mockResolvedValue({
        ...providerService,
        provider: {
          id: 1,
          isActive: false,
        },
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        new BadRequestException('Provider does not offer the selected service'),
      );

      expect(tx.providerAvailability.findUnique).not.toHaveBeenCalled();
    });

    it('rejects booking when the category is inactive', async () => {
      tx.providerService.findUnique.mockResolvedValue({
        ...providerService,
        category: {
          id: 5,
          isActive: false,
        },
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        new BadRequestException('Provider does not offer the selected service'),
      );

      expect(tx.providerAvailability.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a slot belonging to another provider', async () => {
      tx.providerService.findUnique.mockResolvedValue(providerService);
      tx.providerAvailability.findUnique.mockResolvedValue({
        ...slot,
        providerId: 2,
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        new BadRequestException(
          'Availability slot does not belong to this provider',
        ),
      );

      expect(tx.providerAvailability.updateMany).not.toHaveBeenCalled();
    });

    it('returns conflict when the slot cannot be reserved', async () => {
      tx.providerService.findUnique.mockResolvedValue(providerService);
      tx.providerAvailability.findUnique.mockResolvedValue(slot);
      tx.providerAvailability.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        new ConflictException('SLOT_NOT_AVAILABLE'),
      );

      expect(tx.serviceBooking.create).not.toHaveBeenCalled();
    });

    it('rejects an inactive availability slot', async () => {
      tx.providerService.findUnique.mockResolvedValue(providerService);
      tx.providerAvailability.findUnique.mockResolvedValue({
        ...slot,
        isActive: false,
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        new NotFoundException('Availability slot not found'),
      );

      expect(tx.providerAvailability.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels a booking, records history, and releases the slot', async () => {
      tx.serviceBooking.findFirst.mockResolvedValue({
        id: 1,
        status: 'PENDING',
        availabilityId: 3,
      });

      tx.serviceBooking.updateMany.mockResolvedValue({
        count: 1,
      });

      tx.bookingStatusHistory.create.mockResolvedValue({
        id: 2,
        bookingId: 1,
        status: 'CANCELLED',
      });

      tx.providerAvailability.update.mockResolvedValue({
        id: 3,
        isBooked: false,
      });

      const cancelledBooking = {
        id: 1,
        status: 'CANCELLED',
        availabilityId: 3,
      };

      tx.serviceBooking.findUnique.mockResolvedValue(cancelledBooking);

      const result = await service.cancel(1, 'user-test');

      expect(result).toEqual(cancelledBooking);

      expect(tx.serviceBooking.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 'user-test',
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      expect(tx.bookingStatusHistory.create).toHaveBeenCalledWith({
        data: {
          bookingId: 1,
          status: 'CANCELLED',
        },
      });

      expect(tx.providerAvailability.update).toHaveBeenCalledWith({
        where: {
          id: 3,
        },
        data: {
          isBooked: false,
        },
      });
    });

    it('rejects cancellation when the booking cannot be cancelled', async () => {
      tx.serviceBooking.findFirst.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        availabilityId: 3,
      });

      tx.serviceBooking.updateMany.mockResolvedValue({
        count: 0,
      });

      tx.serviceBooking.findUnique.mockResolvedValue({
        status: 'COMPLETED',
      });

      await expect(service.cancel(1, 'user-test')).rejects.toThrow(
        new BadRequestException(
          'Booking with status COMPLETED cannot be cancelled',
        ),
      );

      expect(tx.bookingStatusHistory.create).not.toHaveBeenCalled();
      expect(tx.providerAvailability.update).not.toHaveBeenCalled();
    });

    it('returns not found when the booking does not belong to the user', async () => {
      tx.serviceBooking.findFirst.mockResolvedValue(null);

      await expect(service.cancel(1, 'wrong-user')).rejects.toThrow(
        new NotFoundException('Booking not found'),
      );

      expect(tx.serviceBooking.updateMany).not.toHaveBeenCalled();
    });
  });
});
