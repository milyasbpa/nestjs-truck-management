import { Test, TestingModule } from '@nestjs/testing';
import { LaneService } from '../lane/lane.service';

describe('LaneService', () => {
  let service: LaneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaneService],
    }).compile();

    service = module.get<LaneService>(LaneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
