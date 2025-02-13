import { Test, TestingModule } from '@nestjs/testing';
import { StreetsService } from './streets.service';

describe('StreetsService', () => {
  let service: StreetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreetsService],
    }).compile();

    service = module.get<StreetsService>(StreetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
