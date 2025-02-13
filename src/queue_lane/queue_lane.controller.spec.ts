import { Test, TestingModule } from '@nestjs/testing';
import { QueueLaneController } from './queue_lane.controller';

describe('LaneController', () => {
  let controller: QueueLaneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueLaneController],
    }).compile();

    controller = module.get<QueueLaneController>(QueueLaneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
