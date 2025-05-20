import { Test, TestingModule } from '@nestjs/testing';
import { ProductSubCategoriesController } from './product-subcategories.controller';

describe('ProductSubCategoriesController', () => {
  let controller: ProductSubCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSubCategoriesController],
    }).compile();

    controller = module.get<ProductSubCategoriesController>(ProductSubCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
