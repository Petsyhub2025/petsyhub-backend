import { PipelineStage, Schema, SchemaOptions } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function filterSoftDeletePlugin(schema: Schema, options: SchemaOptions) {
  schema.pre(
    new RegExp(
      '^(find|count|countDocuments|estimatedDocumentCount|findOne|findOneAndDelete|findOneAndRemove|findOneAndReplace|findOneAndUpdate|remove|replaceOne|update|updateOne|updateMany)',
    ),
    function (next) {
      if (this.getFilter().deletedAt === undefined) {
        this.where('deletedAt').equals(null);
      }
      next();
    },
  );

  schema.pre('aggregate', function (next) {
    const hasGeoNearStage = this.pipeline()?.[0]?.['$geoNear'];

    if (!hasGeoNearStage) {
      this.pipeline().unshift({
        $match: {
          deletedAt: {
            $lte: null,
          },
        },
      });
    } else {
      const geoNearStage = this.pipeline()?.[0]?.['$geoNear'];

      if (geoNearStage) {
        this.pipeline()[0]['$geoNear']['query'] = {
          ...geoNearStage.query,
          deletedAt: {
            $lte: null,
          },
        };
      }
    }

    filterSoftDeletedDocsInAggregationLookupRecursively(this.pipeline());
    next();
  });
}

export function filterSoftDeletedDocsInAggregationLookupRecursively(pipeline: PipelineStage[]) {
  pipeline.forEach((stage: any) => {
    if (!(stage as PipelineStage.Lookup).$lookup?.pipeline) return;

    stage.$lookup.pipeline.unshift({
      $match: {
        $expr: {
          $lte: ['$deletedAt', null],
        },
      },
    });

    filterSoftDeletedDocsInAggregationLookupRecursively(stage.$lookup.pipeline);
  });
}
