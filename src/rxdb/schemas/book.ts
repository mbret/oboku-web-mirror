import { BookDocType, InsertableBookDocType } from "oboku-shared";
import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb";
import { MongoUpdateSyntax } from "../../types";
import { withReplicationSchema } from "../rxdb-plugins/replication";
import { SafeUpdateMongoUpdateSyntax } from "../types";

type BookDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<BookDocType>) => Promise<any>
}

type BookDocument = RxDocument<BookDocType, BookDocMethods>

type BookCollectionMethods = {
  post: (json: Omit<InsertableBookDocType, 'rx_model'>) => Promise<BookDocument>,
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<BookDocType>,
    cb: (collection: BookCollection) => RxQuery
  ) => Promise<BookDocument>
}

export type BookCollection = RxCollection<BookDocType, BookDocMethods, BookCollectionMethods>

export const bookDocMethods: BookDocMethods = {
  safeUpdate: function (this: BookDocument, updateObj) {
    return this.update(updateObj)
  }
};

export const bookCollectionMethods: BookCollectionMethods = {
  post: async function (this: BookCollection, json) {
    return this.insert(json as BookDocType)
  },
  safeUpdate: async function (this: BookCollection, json, cb) {
    return cb(this).update(json)
  },
}

export const bookSchemaMigrationStrategies = {
  1: (oldDoc: BookDocType): BookDocType | null => ({
    ...oldDoc,
    modifiedAt: null,
  }),
  2: (oldDoc: BookDocType): BookDocType | null => oldDoc,
}

export const bookSchema: RxJsonSchema<Omit<BookDocType, '_id' | 'rx_model' | '_rev'>> = withReplicationSchema('book', {
  title: 'books',
  version: 2,
  type: 'object',
  properties: {
    collections: { type: 'array', ref: 'obokucollection', items: { type: 'string' } },
    createdAt: { type: ['number'] },
    creator: { type: ['string', 'null'] },
    date: { type: ['number', 'null'] },
    lang: { type: ['string', 'null'] },
    lastMetadataUpdatedAt: { type: ['number', 'null'] },
    links: { ref: 'link', type: 'array', items: { type: 'string' } },
    publisher: { type: ['string', 'null'] },
    readingStateCurrentBookmarkLocation: { type: ['string', 'null'] },
    readingStateCurrentBookmarkProgressPercent: { type: ['number'] },
    readingStateCurrentBookmarkProgressUpdatedAt: { type: ['string', 'null'] },
    readingStateCurrentState: { type: ['string'] },
    rights: { type: ['string', 'null'] },
    subject: { type: ['array', 'null'], items: { type: 'string' } },
    tags: { type: 'array', ref: 'tag', items: { type: 'string' } },
    title: { type: ['string', 'null'] },
    modifiedAt: { type: ['string', 'null'] },
  },
  required: []
})