import { Test, TestingModule } from '@nestjs/testing';
import { TrucksController } from './trucks.controller';

describe('TrucksController', () => {
  let controller: TrucksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrucksController],
    }).compile();

    controller = module.get<TrucksController>(TrucksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
