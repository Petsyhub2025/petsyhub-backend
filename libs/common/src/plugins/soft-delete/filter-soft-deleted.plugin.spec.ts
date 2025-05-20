import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, PipelineStage, Schema, Types } from 'mongoose';
import {
  filterSoftDeletePlugin,
  filterSoftDeletedDocsInAggregationLookupRecursively,
} from './filter-soft-deleted.plugin';
import { TestingContainers } from '@instapets-backend/testing';

describe('FilterSoftDeletedPlugin', () => {
  let module: TestingModule;
  let mainModel: Model<any>;
  let lookupModel: Model<any>;

  beforeAll(async () => {
    const mainSchema = new Schema<any>(
      {
        name: {
          type: String,
          required: true,
        },
        deletedAt: {
          type: Date,
          default: null,
        },
      },
      { timestamps: true },
    );

    const lookupSchema = new Schema<any>(
      {
        name: {
          type: String,
          required: true,
        },
        reference: {
          type: Types.ObjectId,
          ref: 'Test',
        },
        deletedAt: {
          type: Date,
          default: null,
        },
      },
      { timestamps: true },
    );

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: TestingContainers.mongodb.uri,
            connectionFactory(connection, name) {
              connection.plugin(filterSoftDeletePlugin);
              return connection;
            },
          }),
        }),
        MongooseModule.forFeature([
          { name: 'Main', schema: mainSchema },
          { name: 'Lookup', schema: lookupSchema },
        ]),
      ],
    }).compile();

    mainModel = module.get<Model<any>>(getModelToken('Main'));
    lookupModel = module.get<Model<any>>(getModelToken('Lookup'));

    const insertedDocuments = await mainModel.insertMany([
      { name: 'test1' },
      { name: 'test2', deletedAt: new Date() },
      { name: 'test3' },
    ]);

    await lookupModel.insertMany([
      { name: 'test1', reference: insertedDocuments[0]._id, deletedAt: new Date() },
      { name: 'test2', reference: insertedDocuments[1]._id },
      { name: 'test3', reference: insertedDocuments[2]._id, deletedAt: new Date() },
    ]);
  });

  it('model should be defined', () => {
    expect(mainModel).toBeDefined();
  });

  it('mainModel to have 3 documents', async () => {
    const documents = await mainModel.collection.find().toArray();
    expect(documents.length).toBe(3);
  });

  it('lookupModel to have 3 documents', async () => {
    const documents = await lookupModel.collection.find().toArray();
    expect(documents.length).toBe(3);
  });

  it('mainModel to have 2 documents using .find()', async () => {
    const documents = await mainModel.find({});
    expect(documents.length).toBe(2);
  });

  it('lookupModel to have 1 documents using .find()', async () => {
    const documents = await lookupModel.find({});
    expect(documents.length).toBe(1);
  });

  it('mainModel to have 2 documents using .aggregate()', async () => {
    const documents = await mainModel.aggregate([
      {
        $match: {},
      },
      {
        $project: {
          _id: 1,
          name: 1,
          deletedAt: 1,
        },
      },
    ]);

    expect(documents.length).toBe(2);
  });

  it('lookupModel to have 1 documents using .aggregate()', async () => {
    const documents = await lookupModel.aggregate([
      {
        $match: {},
      },
      {
        $project: {
          _id: 1,
          name: 1,
          reference: 1,
          deletedAt: 1,
        },
      },
    ]);

    expect(documents.length).toBe(1);
  });

  it('mainModel to have 2 documents using .aggregate() with $lookup only returning no document', async () => {
    const documents = await mainModel.aggregate([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'lookups',
          let: { reference: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$reference'],
                },
              },
            },
          ],
          as: 'lookups',
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          deletedAt: 1,
          lookups: 1,
        },
      },
    ]);

    expect(documents.length).toBe(2);

    const [firstDocument, secondDocument] = documents;

    expect(firstDocument.lookups.length).toBe(0);
    expect(secondDocument.lookups.length).toBe(0);
  });

  it('aggregation lookup pipelines to include deletedAt query recursively', async () => {
    const pipeline: PipelineStage[] = [
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'lookups',
          let: { reference: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$reference'],
                },
              },
            },
            {
              $lookup: {
                from: 'lookups',
                let: { reference: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$reference'],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'lookups',
                      let: { reference: '$_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: ['$_id', '$$reference'],
                            },
                          },
                        },
                        {
                          $lookup: {
                            from: 'lookups',
                            let: { reference: '$_id' },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ['$_id', '$$reference'],
                                  },
                                },
                              },
                            ],
                            as: 'lookups',
                          },
                        },
                      ],
                      as: 'lookups',
                    },
                  },
                ],
                as: 'lookups',
              },
            },
          ],
          as: 'lookups',
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          deletedAt: 1,
          lookups: 1,
        },
      },
    ];

    filterSoftDeletedDocsInAggregationLookupRecursively(pipeline);

    expect(pipeline).toEqual([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'lookups',
          let: { reference: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $lte: ['$deletedAt', null],
                },
              },
            },
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$reference'],
                },
              },
            },
            {
              $lookup: {
                from: 'lookups',
                let: { reference: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $lte: ['$deletedAt', null],
                      },
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$reference'],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'lookups',
                      let: { reference: '$_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $lte: ['$deletedAt', null],
                            },
                          },
                        },
                        {
                          $match: {
                            $expr: {
                              $eq: ['$_id', '$$reference'],
                            },
                          },
                        },
                        {
                          $lookup: {
                            from: 'lookups',
                            let: { reference: '$_id' },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $lte: ['$deletedAt', null],
                                  },
                                },
                              },
                              {
                                $match: {
                                  $expr: {
                                    $eq: ['$_id', '$$reference'],
                                  },
                                },
                              },
                            ],
                            as: 'lookups',
                          },
                        },
                      ],
                      as: 'lookups',
                    },
                  },
                ],
                as: 'lookups',
              },
            },
          ],
          as: 'lookups',
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          deletedAt: 1,
          lookups: 1,
        },
      },
    ]);
  });

  afterAll(async () => {
    await module.close();
  });
});
