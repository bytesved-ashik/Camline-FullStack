import { Document } from 'mongoose';

const deleteAtPath = (obj: object, path: string[], index: number) => {
  if (index === path.length - 1) {
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

const toJSON = (schema: any) => {
  const transform = schema.options.toJSON && schema.options.toJSON.transform;

  schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
    transform(
      doc: Document,
      ret: Document & {
        deleted: boolean;
      },
      options: object,
    ) {
      Object.keys(schema.paths).forEach((path) => {
        if (schema.paths[path].options && schema.paths[path].options.private) {
          deleteAtPath(ret, path.split('.'), 0);
        }
      });

      // ret.id = ret._id.toString();
      // delete ret._id;
      delete ret.__v;
      delete ret.deleted;
      if (transform) {
        return transform(doc, ret, options);
      }
    },
  });
};

export default toJSON;
