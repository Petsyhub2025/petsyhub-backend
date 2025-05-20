import { ModelNames } from '@common/constants';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { BaseBranch, IBaseBranchModel } from '@common/schemas/mongoose/branch/base-branch.type';
import { BranchEventsEnum, BranchStatusEnum } from '@common/schemas/mongoose/branch/base-branch.enum';
import { IBrandModel } from '@common/schemas/mongoose/brand/brand.type';

@Injectable()
export class BranchEventListener {
  constructor(
    @Inject(ModelNames.BASE_BRANCH)
    private baseBranchModel: IBaseBranchModel,
    @Inject(ModelNames.BRAND)
    private brandModel: IBrandModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(BranchEventsEnum.BRANCH_APPROVED, { promisify: true })
  async approveBranch(event: HydratedDocument<BaseBranch>) {
    return this.errorHandler.eventListenerErrorHandler(BranchEventsEnum.BRANCH_APPROVED, async () => {
      await this.brandModel.findByIdAndUpdate(event.brand, {
        $addToSet: { cities: event.city, countries: event.country },
      });
    });
  }

  @OnEvent(BranchEventsEnum.BRANCH_SUSPEND, { promisify: true })
  async suspendBranch(event: HydratedDocument<BaseBranch>) {
    return this.errorHandler.eventListenerErrorHandler(BranchEventsEnum.BRANCH_SUSPEND, async () => {
      await this.checkToRemoveBrandCitiesAndCountries(event);
    });
  }

  @OnEvent(BranchEventsEnum.BRANCH_UNSUSPEND, { promisify: true })
  async unsuspendBranch(event: HydratedDocument<BaseBranch>) {
    return this.errorHandler.eventListenerErrorHandler(BranchEventsEnum.BRANCH_UNSUSPEND, async () => {
      await this.brandModel.findByIdAndUpdate(event.brand, {
        $addToSet: { cities: event.city, countries: event.country },
      });
    });
  }

  async checkToRemoveBrandCitiesAndCountries(event: HydratedDocument<BaseBranch>) {
    const [brand, branchWithSameCityAndCountry] = await Promise.all([
      this.brandModel.findById(event.brand),
      this.baseBranchModel.exists({
        brand: event.brand,
        status: BranchStatusEnum.APPROVED,
        city: event.city,
        country: event.country,
      }),
    ]);

    if (!branchWithSameCityAndCountry) {
      brand.cities = brand.cities.filter((city) => city.toString() !== event.city.toString());
      brand.countries = brand.countries.filter((country) => country.toString() !== event.country.toString());
    }
    await brand.save();
  }
}
