import { BookDocType } from "oboku-shared"
import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent } from "rxdb"
import { useAxiosClient } from "../axiosClient"
import { API_URI } from "../constants"
import { useDatabase } from "../rxdb"
import { DownloadState, normalizedBooksState } from "./states"

export const useBooksInitialState = () => {
  const db = useDatabase()
  const [, setBooks] = useRecoilState(normalizedBooksState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      (async () => {
        try {
          const books = await db.book.find().exec()
          const booksAsMap = books.reduce((map: UnwrapRecoilValue<typeof normalizedBooksState>, obj) => {
            map[obj._id] = ({ ...obj.toJSON(), downloadProgress: 0, downloadState: DownloadState.None })
            return map
          }, {})
          setBooks(booksAsMap)

          setIsReady(true)
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [db, setBooks])

  return isReady
}

export const useBooksObservers = () => {
  const db = useDatabase()
  const [, setBooks] = useRecoilState(normalizedBooksState)

  useEffect(() => {
    db?.book.$.subscribe((changeEvent: RxChangeEvent<BookDocType>) => {
      console.warn('CHANGE EVENT', changeEvent)
      switch (changeEvent.operation) {
        case 'INSERT': {
          return setBooks(state => ({
            ...state,
            [changeEvent.documentData._id]: {
              ...changeEvent.documentData,
              downloadProgress: 0,
              downloadState: DownloadState.None,
            },
          }))
        }
        case 'UPDATE': {
          return setBooks(state => {
            return {
              ...state,
              [changeEvent.documentData._id]: {
                ...state[changeEvent.documentData._id]!,
                ...changeEvent.documentData,
              },
            }
          })
        }
        case 'DELETE': {
          return setBooks(({ [changeEvent.documentData._id]: deletedTag, ...rest }) => rest)
        }
      }
    })
  }, [db, setBooks])
}
