import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringLogService } from './monitoring-log.service';

describe('MonitoringLogService', () => {
  let service: MonitoringLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitoringLogService],
    }).compile();

    service = module.get<MonitoringLogService>(MonitoringLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
