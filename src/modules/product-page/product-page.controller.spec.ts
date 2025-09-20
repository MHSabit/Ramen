import { Test, TestingModule } from '@nestjs/testing';
import { ProductPageController } from './product-page.controller';
import { ProductPageService } from './product-page.service';

describe('ProductPageController', () => {
  let controller: ProductPageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductPageController],
      providers: [ProductPageService],
    }).compile();

    controller = module.get<ProductPageController>(ProductPageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
