import { Test, TestingModule } from '@nestjs/testing';
import { ProductPageService } from './product-page.service';

describe('ProductPageService', () => {
  let service: ProductPageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductPageService],
    }).compile();

    service = module.get<ProductPageService>(ProductPageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
