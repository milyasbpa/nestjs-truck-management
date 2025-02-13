import { Test, TestingModule } from '@nestjs/testing';
import { QueueLaneService } from './queue_lane.service';

describe('QueueLaneService', () => {
  let service: QueueLaneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueLaneService],
    }).compile();

    service = module.get<QueueLaneService>(QueueLaneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
