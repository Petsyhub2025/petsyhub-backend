import { Test, TestingModule } from '@nestjs/testing';
import { ProductSubCategoriesService } from './product-subcategories.service';

describe('ProductSubCategoriesService', () => {
  let service: ProductSubCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSubCategoriesService],
    }).compile();

    service = module.get<ProductSubCategoriesService>(ProductSubCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
