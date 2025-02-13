import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringLogController } from './monitoring-log.controller';

describe('MonitoringLogController', () => {
  let controller: MonitoringLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringLogController],
    }).compile();

    controller = module.get<MonitoringLogController>(MonitoringLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
