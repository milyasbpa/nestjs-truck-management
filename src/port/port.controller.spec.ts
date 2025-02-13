import { Test, TestingModule } from '@nestjs/testing';
import { PortController } from './port.controller';

describe('PortController', () => {
  let controller: PortController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortController],
    }).compile();

    controller = module.get<PortController>(PortController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
