import { Test, TestingModule } from '@nestjs/testing';
import { PortService } from './port.service';

describe('PortService', () => {
  let service: PortService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortService],
    }).compile();

    service = module.get<PortService>(PortService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
