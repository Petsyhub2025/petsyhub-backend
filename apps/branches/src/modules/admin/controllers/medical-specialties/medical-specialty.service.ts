import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IMedicalSpecialtyModel,
  ModelNames,
  addPaginationStages,
  IBaseBranchModel,
  BasePaginationQuery,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { CreateMedicalSpecialtyDto } from './dto/create-medical-specialty-type.dto';
import { MedicalSpecialtyIdParamDto } from '@branches/admin/shared/dto/medical-specialty-id-param.dto';
import { UpdateMedicalSpecialtyDto } from './dto/update-medical-specialty-type.dto';
import { getMedicalSpecialtiesPipeline } from './helpers/medical-specialty-pipeline.helper';
import { errorManager } from '@branches/admin/shared/config/errors.config';

@Injectable()
export class MedicalSpecialtyService {
  constructor(
    @Inject(ModelNames.MEDICAL_SPECIALTY) private medicalSpecialtyModel: IMedicalSpecialtyModel,
    @Inject(ModelNames.BASE_BRANCH) private baseBranchModel: IBaseBranchModel,
  ) {}

  async createMedicalSpecialty(adminId: string, body: CreateMedicalSpecialtyDto) {
    const { name } = body;

    if (await this.medicalSpecialtyModel.exists({ name }))
      throw new ConflictException(errorManager.MEDICAL_SPECIALTY_ALREADY_EXISTS);

    const newMedicalSpecialty = new this.medicalSpecialtyModel(body);
    const savedMedicalSpecialty = await newMedicalSpecialty.save();

    return savedMedicalSpecialty;
  }

  async updateMedicalSpecialty(
    adminId: string,
    { medicalSpecialtyId }: MedicalSpecialtyIdParamDto,
    body: UpdateMedicalSpecialtyDto,
  ) {
    const { name } = body;

    if (
      name &&
      (await this.medicalSpecialtyModel.exists({ _id: { $ne: new Types.ObjectId(medicalSpecialtyId) }, name }))
    )
      throw new ConflictException(errorManager.MEDICAL_SPECIALTY_ALREADY_EXISTS);

    const medicalSpecialty = await this.medicalSpecialtyModel.findById(medicalSpecialtyId);

    if (!medicalSpecialty) throw new NotFoundException(errorManager.MEDICAL_SPECIALTY_NOT_FOUND);

    medicalSpecialty.set(body);
    const savedMedicalSpecialty = await medicalSpecialty.save();

    return savedMedicalSpecialty;
  }

  async deleteMedicalSpecialty(adminId: string, { medicalSpecialtyId }: MedicalSpecialtyIdParamDto) {
    const medicalSpecialty = await this.medicalSpecialtyModel.findOne({ _id: new Types.ObjectId(medicalSpecialtyId) });

    if (!medicalSpecialty) throw new NotFoundException(errorManager.MEDICAL_SPECIALTY_NOT_FOUND);

    //TODO: update this when requirments change
    if (await this.baseBranchModel.exists({ medicalSpecialties: medicalSpecialty._id }))
      throw new ForbiddenException(errorManager.MEDICAL_SPECIALTY_ALREADY_ASSIGNED_TO_BRANCHES);

    await medicalSpecialty.deleteDoc();
  }

  async getMedicalSpecialties(adminId: string, query: BasePaginationQuery) {
    const { page, limit } = query;

    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.medicalSpecialtyModel.aggregate(matchStage).count('total'),
      this.medicalSpecialtyModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...getMedicalSpecialtiesPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getMedicalSpecialtyById(adminId: string, { medicalSpecialtyId }: MedicalSpecialtyIdParamDto) {
    const [medicalSpecialty] = await this.medicalSpecialtyModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(medicalSpecialtyId),
        },
      },
      ...getMedicalSpecialtiesPipeline(),
    ]);
    if (!medicalSpecialty) throw new NotFoundException(errorManager.MEDICAL_SPECIALTY_NOT_FOUND);

    return medicalSpecialty;
  }
}
