import { Schema } from 'mongoose';
import { MinMaxRange } from './min-max-range.type';

export const MinMaxRangeSchema = new Schema<MinMaxRange>(
  {
    min: {
      type: Number,
      required: function (this: MinMaxRange) {
        return this.max == undefined;
      },
    },

    max: {
      type: Number,
      required: function (this: MinMaxRange) {
        return this.min == undefined;
      },
    },
  },
  {
    _id: false,
  },
);
