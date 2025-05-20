import {
  AdminIndexHelperService,
  AreaIndexHelperService,
  CityIndexHelperService,
  AppointmentsIndexHelperService,
  BranchServiceTypeIndexHelperService,
  CommentIndexHelperService,
  CommentReplyIndexHelperService,
  CountryIndexHelperService,
  DynamicLinksIndexHelperService,
  EventCategoryIndexHelperService,
  EventFacilityIndexHelperService,
  FoundPostIndexHelperService,
  LostPostIndexHelperService,
  PetBreedIndexHelperService,
  PetFollowsIndexHelperService,
  PetIndexHelperService,
  PetTypeIndexHelperService,
  PostIndexHelperService,
  ServiceProviderBranchIndexHelperService,
  ServiceProviderIndexHelperService,
  UserFollowsIndexHelperService,
  UserIndexHelperService,
  UserPushNotificationsIndexHelperService,
  UserSegmentsIndexHelperService,
} from '@elasticsync/admin/shared';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { CONNECTION_RETRY_DELAY, MAX_CONNECTION_RETRIES } from '@elasticsync/shared-module/config/consts.config';
import { CustomLoggerService, ElasticsearchService } from '@instapets-backend/common';
import { Connection, ConnectionStates } from 'mongoose';

@Injectable()
export class ElasticSearchMigrationService implements OnModuleInit {
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly elasticSearchService: ElasticsearchService,
    private readonly logger: CustomLoggerService,
    private readonly areaIndexHelperService: AreaIndexHelperService,
    private readonly cityIndexHelperService: CityIndexHelperService,
    private readonly countryIndexHelperService: CountryIndexHelperService,
    private readonly petBreedIndexHelperService: PetBreedIndexHelperService,
    private readonly petTypeIndexHelperService: PetTypeIndexHelperService,
    private readonly commentReplyIndexHelperService: CommentReplyIndexHelperService,
    private readonly commentIndexHelperService: CommentIndexHelperService,
    private readonly petIndexHelperService: PetIndexHelperService,
    private readonly postIndexHelperService: PostIndexHelperService,
    private readonly userIndexHelperService: UserIndexHelperService,
    private readonly branchServiceTypeIndexHelperService: BranchServiceTypeIndexHelperService,
    private readonly serviceProviderIndexHelperService: ServiceProviderIndexHelperService,
    private readonly serviceProviderBranchIndexHelperService: ServiceProviderBranchIndexHelperService,
    private readonly adminIndexHelperService: AdminIndexHelperService,
    private readonly userFollowsIndexHelperService: UserFollowsIndexHelperService,
    private readonly petFollowsIndexHelperService: PetFollowsIndexHelperService,
    private readonly eventCategoryIndexHelperService: EventCategoryIndexHelperService,
    private readonly eventFacilityIndexHelperService: EventFacilityIndexHelperService,
    private readonly appointmentsIndexHelperService: AppointmentsIndexHelperService,
    private readonly userSegmentsIndexHelperService: UserSegmentsIndexHelperService,
    private readonly dynamicLinksIndexHelperService: DynamicLinksIndexHelperService,
    private readonly userPushNotificationsIndexHelperService: UserPushNotificationsIndexHelperService,
    private readonly lostPostIndexHelperService: LostPostIndexHelperService,
    private readonly foundPostIndexHelperService: FoundPostIndexHelperService,
  ) {}

  indexHelpers = [
    this.areaIndexHelperService,
    this.cityIndexHelperService,
    this.countryIndexHelperService,
    this.petBreedIndexHelperService,
    this.petTypeIndexHelperService,
    this.commentReplyIndexHelperService,
    this.commentIndexHelperService,
    this.petIndexHelperService,
    this.postIndexHelperService,
    this.userIndexHelperService,
    this.branchServiceTypeIndexHelperService,
    this.serviceProviderIndexHelperService,
    this.serviceProviderBranchIndexHelperService,
    this.adminIndexHelperService,
    this.userFollowsIndexHelperService,
    this.petFollowsIndexHelperService,
    this.eventCategoryIndexHelperService,
    this.eventFacilityIndexHelperService,
    this.appointmentsIndexHelperService,
    this.userSegmentsIndexHelperService,
    this.dynamicLinksIndexHelperService,
    this.userPushNotificationsIndexHelperService,
    this.lostPostIndexHelperService,
    this.foundPostIndexHelperService,
  ];

  async onModuleInit() {
    await this.checkConnections();

    this.logger.log('Connections established successfully');
    this.migrate();
    // this.resetAndMigrate();
  }

  async migrate() {
    this.logger.log('Starting Elasticsearch Migration Process...');
    for (const indexHelper of this.indexHelpers) {
      if (await indexHelper.validateIndex()) {
        await indexHelper.listen();
      } else {
        await indexHelper.reCreateIndex();
        await indexHelper.migrate();
        await indexHelper.listen();
      }
    }
    this.logger.log('Elasticsearch collections listening.');
  }

  async resetAndMigrate() {
    this.logger.log('Starting Elasticsearch Sync...');
    await this.recreateIndices();
    await this.migrateAllCollections();
    await this.listenToAllCollections();
  }

  private async recreateIndices() {
    this.logger.log('Recreating elasticsearch indexes...');

    for (const indexHelper of this.indexHelpers) {
      await indexHelper.reCreateIndex();
    }

    this.logger.log('Elasticsearch indexes recreated.');
  }

  private async migrateAllCollections() {
    this.logger.log('Migrating Elasticsearch collections...');

    for (const indexHelper of this.indexHelpers) {
      await indexHelper.migrate();
    }

    this.logger.log('Elasticsearch collections synchronized.');
  }

  private async listenToAllCollections() {
    for (const indexHelper of this.indexHelpers) {
      await indexHelper.listen();
    }

    this.logger.log('Elasticsearch collections listening.');
  }

  private async checkConnections() {
    let retryCount = 0;
    let isMongoConnected = this.connection.readyState === ConnectionStates.connected;
    let isElasticConnected = await this.isElasticConnected();

    while (!isMongoConnected || !isElasticConnected) {
      if (retryCount >= MAX_CONNECTION_RETRIES) {
        this.logger.error(`Connections could not be established after ${MAX_CONNECTION_RETRIES} maximum retries.`);
        process.exit(1);
      }

      this.logger.log(
        `Retry ${retryCount + 1}: Connections not established. Retrying in ${CONNECTION_RETRY_DELAY}ms...`,
      );
      await this.delay(CONNECTION_RETRY_DELAY);

      isMongoConnected = this.connection.readyState === ConnectionStates.connected;
      isElasticConnected = !isElasticConnected ? await this.isElasticConnected() : false;
      retryCount++;
    }
  }

  private async isElasticConnected(): Promise<boolean> {
    try {
      await this.elasticSearchService.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
