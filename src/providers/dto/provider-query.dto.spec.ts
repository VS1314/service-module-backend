import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProviderQueryDto } from './provider-query.dto';

describe('ProviderQueryDto', () => {
  async function validateQuery(input: Record<string, unknown>) {
    const dto = plainToInstance(ProviderQueryDto, input);
    const errors = await validate(dto);

    return { dto, errors };
  }

  it('accepts valid query parameters and transforms numeric values', async () => {
    const { dto, errors } = await validateQuery({
      q: 'carpenter',
      categoryId: '3',
      minRating: '4.5',
      minDiscount: '30',
      sort: 'rating_desc',
      page: '2',
      limit: '20',
    });

    expect(errors).toHaveLength(0);
    expect(dto.categoryId).toBe(3);
    expect(dto.minRating).toBe(4.5);
    expect(dto.minDiscount).toBe(30);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
  });

  it('trims search whitespace', async () => {
    const { dto, errors } = await validateQuery({
      q: '  carpenter  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.q).toBe('carpenter');
  });

  it('converts a whitespace-only search to undefined', async () => {
    const { dto, errors } = await validateQuery({
      q: '   ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.q).toBeUndefined();
  });

  it('rejects a rating greater than 5', async () => {
    const { errors } = await validateQuery({
      minRating: '6',
    });

    expect(errors.some((error) => error.property === 'minRating')).toBe(true);
  });

  it('rejects a discount greater than 100', async () => {
    const { errors } = await validateQuery({
      minDiscount: '101',
    });

    expect(errors.some((error) => error.property === 'minDiscount')).toBe(true);
  });

  it('rejects an unsupported sort value', async () => {
    const { errors } = await validateQuery({
      sort: 'random',
    });

    expect(errors.some((error) => error.property === 'sort')).toBe(true);
  });

  it('rejects page zero', async () => {
    const { errors } = await validateQuery({
      page: '0',
    });

    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });

  it('rejects a limit greater than 100', async () => {
    const { errors } = await validateQuery({
      limit: '101',
    });

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });
});
