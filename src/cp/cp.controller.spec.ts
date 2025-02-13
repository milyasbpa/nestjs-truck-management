import { Test, TestingModule } from '@nestjs/testing';
import { CpController } from './cp.controller';

describe('CpController', () => {
  let controller: CpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CpController],
    }).compile();

    controller = module.get<CpController>(CpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
