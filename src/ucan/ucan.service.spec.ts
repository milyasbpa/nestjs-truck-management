import { Test, TestingModule } from '@nestjs/testing';
import { UcanService } from './ucan.service';

describe('UcanService', () => {
  let service: UcanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UcanService],
    }).compile();

    service = module.get<UcanService>(UcanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
