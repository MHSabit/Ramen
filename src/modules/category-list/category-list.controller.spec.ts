import { Test, TestingModule } from '@nestjs/testing';
import { CategoryListController } from './category-list.controller';
import { CategoryListService } from './category-list.service';

describe('CategoryListController', () => {
  let controller: CategoryListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryListController],
      providers: [CategoryListService],
    }).compile();

    controller = module.get<CategoryListController>(CategoryListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
