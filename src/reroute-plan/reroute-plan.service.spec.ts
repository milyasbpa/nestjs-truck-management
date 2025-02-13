import { Test, TestingModule } from '@nestjs/testing';
import { ReroutePlanService } from './reroute-plan.service';

describe('ReroutePlanService', () => {
  let service: ReroutePlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReroutePlanService],
    }).compile();

    service = module.get<ReroutePlanService>(ReroutePlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
