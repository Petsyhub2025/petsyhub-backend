import { DeepLinkService, FirebaseDynamicLinkService, TrieService } from '@common/helpers/services';

export class MongooseCommonModule {
  private static providers = [DeepLinkService, FirebaseDynamicLinkService];

  static forRoot() {
    return {
      module: MongooseCommonModule,
      imports: [],
      providers: [...this.providers, TrieService],
      exports: [...this.providers],
      global: true,
    };
  }
}
