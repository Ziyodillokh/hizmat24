import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ApproveApplicationDto,
  MIN_REJECTION_REASON_LENGTH,
  RejectApplicationDto,
} from './review-application.dto';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const problems = async (Dto: typeof RejectApplicationDto, payload: unknown): Promise<string[]> =>
  (await validate(plainToInstance(Dto, payload))).map((error) => error.property);

describe('RejectApplicationDto', () => {
  it('sabab MAJBURIY — usta nega rad etilganini bilishi kerak', async () => {
    await expect(problems(RejectApplicationDto, {})).resolves.toEqual(['reason']);
  });

  it('juda qisqa sabab qabul qilinmaydi', async () => {
    const payload = { reason: 'a'.repeat(MIN_REJECTION_REASON_LENGTH - 1) };

    await expect(problems(RejectApplicationDto, payload)).resolves.toEqual(['reason']);
  });

  it('tushunarli sabab oʻtadi', async () => {
    const payload = { reason: 'Sertifikat nusxasi oʻqilmadi — qaytadan yuboring.' };

    await expect(problems(RejectApplicationDto, payload)).resolves.toEqual([]);
  });
});

describe('ApproveApplicationDto', () => {
  it('kamida bitta xizmat tanlanishi shart — xizmatsiz usta buyurtma olmaydi', async () => {
    const errors = await validate(plainToInstance(ApproveApplicationDto, { categoryIds: [] }));

    expect(errors.map((error) => error.property)).toEqual(['categoryIds']);
  });

  it('uuid boʻlmagan qiymat rad etiladi', async () => {
    const errors = await validate(
      plainToInstance(ApproveApplicationDto, { categoryIds: ['santexnika'] }),
    );

    expect(errors).toHaveLength(1);
  });

  it('toʻgʻri roʻyxat oʻtadi', async () => {
    const errors = await validate(
      plainToInstance(ApproveApplicationDto, { categoryIds: [CATEGORY_ID] }),
    );

    expect(errors).toEqual([]);
  });
});
