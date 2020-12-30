import { useAxiosClient } from "../axiosClient"
import { BookDocType, LinkType, ReadingStateState } from 'oboku-shared'
import { useRxMutation } from "../rxdb/hooks"
import { useDatabase } from "../rxdb"
import { API_SYNC_URL } from "../constants"
import { first } from 'rxjs/operators'
import PouchDB from 'pouchdb'
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { Report } from "../report"
import { useGetLazySignedGapi } from "../dataSources/google/helpers"
import { useCallback } from "react"
import { useDownloadFileFromFile } from "../download/useDownloadFileFromFile"

export const useRemoveBook = () => {
  const removeDownload = useRemoveDownloadFile()
  const [removeBook] = useRxMutation((db, { id }: { id: string }) => db.book.findOne({ selector: { _id: id } }).remove())

  return async ({ id }: { id: string }) => {
    await Promise.all([
      removeDownload(id),
      removeBook({ id })
    ])
  }
}

export const useRemoveTagToBook = () => {
  const [removeTag] = useRxMutation(
    (db, { _id, tagId }: { _id: string, tagId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { tags: [tagId] } })
  )

  return (variables: { bookId: string, tagId: string }) => {
    removeTag({ _id: variables.bookId, tagId: variables.tagId })
  }
}

export const useAddTagToBook = () =>
  useRxMutation(
    (db, { _id, tagId }: { _id: string, tagId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $push: { tags: tagId } })
  )

export const useUpdateBook = () =>
  useRxMutation(
    (db, { _id, ...rest }: Partial<BookDocType>) =>
      db.book.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )

export const useRefreshBookMetadata = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateBook] = useUpdateBook()
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return async (bookId: string) => {
    const book = await database?.book.findOne({ selector: { _id: bookId } }).exec()
    const firstLink = await database?.link.findOne({ selector: { _id: book?.links[0] } }).exec()

    if (firstLink?.type === LinkType.File) return

    let credentials
    switch (firstLink?.type) {
      case LinkType.Drive: {
        credentials = (await getLazySignedGapi())?.credentials
        break
      }
      default:
    }

    await updateBook({ _id: bookId, lastMetadataUpdatedAt: null })

    database?.sync({
      collectionNames: ['link', 'book'],
      syncOptions: () => ({
        remote: new PouchDB(API_SYNC_URL, {
          fetch: (url, opts) => {
            (opts?.headers as unknown as Map<string, string>).set('Authorization', client.getAuthorizationHeader())
            return PouchDB.fetch(url, opts)
          }
        }),
        direction: {
          push: true,
        },
        options: {
          retry: false,
          live: false,
          timeout: 5000,
        }
      })
    })
      .complete$
      .pipe(first())
      .subscribe(completed => {
        completed && client.refreshMetadata(bookId, credentials).catch(Report.error)
      })
  }
}

export const useAddCollectionToBook = () =>
  useRxMutation(
    (db, { _id, collectionId }: { _id: string, collectionId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $push: { collections: collectionId } })
  )

export const useRemoveCollectionFromBook = () =>
  useRxMutation(
    (db, { _id, collectionId }: { _id: string, collectionId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { collections: [collectionId] } })
  )

export const useAddBook = () => {
  const database = useDatabase()
  const refreshMetadata = useRefreshBookMetadata()

  const cb = async ({
    book,
    link
  }: {
    book?: Partial<Parameters<NonNullable<typeof database>['book']['post']>[0]>
    link: Parameters<NonNullable<typeof database>['link']['post']>[0]
  }) => {
    try {
      if (database) {
        const linkAdded = await database.link.post(link)
        const newBook = await database.book.post({
          lastMetadataUpdatedAt: null,
          title: null,
          readingStateCurrentBookmarkLocation: null,
          readingStateCurrentBookmarkProgressUpdatedAt: null,
          readingStateCurrentBookmarkProgressPercent: 0,
          readingStateCurrentState: ReadingStateState.NotStarted,
          createdAt: Date.now(),
          lang: null,
          tags: [],
          links: [linkAdded.primary],
          date: null,
          publisher: null,
          rights: null,
          subject: null,
          creator: null,
          collections: [],
          ...book,
        })
        refreshMetadata(newBook._id)

        return newBook
      }
    } catch (e) {
      Report.error(e)
    }
  }

  return [cb]
}

export const useAddBookFromFile = () => {
  const [addBook] = useAddBook()
  const downloadFileFromFile = useDownloadFileFromFile()

  return useCallback(async (file: File) => {
    const book = await addBook({
      link: { book: null, data: null, resourceId: 'file', type: LinkType.File },
      book: {
        title: file.name,
        lastMetadataUpdatedAt: Date.now(),
      }
    })
    if (book) {
      await downloadFileFromFile({ file, id: book?._id })
    }
  }, [addBook, downloadFileFromFile])
}