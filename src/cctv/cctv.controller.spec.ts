import { Test, TestingModule } from '@nestjs/testing';
import { CctvController } from './cctv.controller';

describe('CctvController', () => {
  let controller: CctvController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CctvController],
    }).compile();

    controller = module.get<CctvController>(CctvController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
