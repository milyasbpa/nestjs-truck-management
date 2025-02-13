import { Test, TestingModule } from '@nestjs/testing';
import { ReroutePlanController } from './reroute-plan.controller';

describe('ReroutePlanController', () => {
  let controller: ReroutePlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReroutePlanController],
    }).compile();

    controller = module.get<ReroutePlanController>(ReroutePlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
