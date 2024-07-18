import { NextFunction } from 'express';

import * as uniqueSlug from 'unique-slug';
import slugify from 'slugify';

export default function validSlugGenerator(schema: any) {
  schema.pre('save', function (next: NextFunction) {
    Object.keys(schema.paths).forEach((path) => {
      if (schema.paths[path].options && schema.paths[path].options.slug) {
        if (!this[path]) {
          this[path] = `tracker-${uniqueSlug()}`;
        } else {
          this[path] = slugify(this[path]);
        }
      }
    });
    next();
  });
}
