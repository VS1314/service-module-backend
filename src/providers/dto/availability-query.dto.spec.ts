import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AvailabilityQueryDto } from './availability-query.dto';

describe('AvailabilityQueryDto', () => {
  async function validateDate(date: string) {
    const dto = plainToInstance(AvailabilityQueryDto, { date });

    return validate(dto);
  }

  it('accepts a valid YYYY-MM-DD date', async () => {
    const errors = await validateDate('2026-09-14');

    expect(errors).toHaveLength(0);
  });

  it('accepts a valid leap-year date', async () => {
    const errors = await validateDate('2024-02-29');

    expect(errors).toHaveLength(0);
  });

  it('rejects a timestamp', async () => {
    const errors = await validateDate('2026-09-14T10:00:00Z');

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects DD-MM-YYYY format', async () => {
    const errors = await validateDate('14-09-2026');

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects an impossible calendar date', async () => {
    const errors = await validateDate('2026-02-30');

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a non-leap-year February 29', async () => {
    const errors = await validateDate('2025-02-29');

    expect(errors.length).toBeGreaterThan(0);
  });
});
