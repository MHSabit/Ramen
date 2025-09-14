import { Test, TestingModule } from '@nestjs/testing';
import { CategoryListService } from './category-list.service';

describe('CategoryListService', () => {
  let service: CategoryListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryListService],
    }).compile();

    service = module.get<CategoryListService>(CategoryListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
