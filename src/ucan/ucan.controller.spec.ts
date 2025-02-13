import { Test, TestingModule } from '@nestjs/testing';
import { UcanController } from './ucan.controller';

describe('UcanController', () => {
  let controller: UcanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UcanController],
    }).compile();

    controller = module.get<UcanController>(UcanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
