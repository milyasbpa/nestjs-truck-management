import { Test, TestingModule } from '@nestjs/testing';
import { LaneController } from './geofence.controller';

describe('LaneController', () => {
  let controller: LaneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LaneController],
    }).compile();

    controller = module.get<LaneController>(LaneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
