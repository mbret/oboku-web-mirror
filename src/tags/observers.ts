import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent } from "rxdb"
import { useDatabase } from "../rxdb"
import { TagsDocType } from "../rxdb/databases"
import { normalizedTagsState } from "./states"

export const useTagsInitialState = () => {
  const db = useDatabase()
  const [, setTags] = useRecoilState(normalizedTagsState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      (async () => {
        try {
          const tags = await db.tag.find().exec()
          const tagsAsMap = tags.reduce((map: UnwrapRecoilValue<typeof normalizedTagsState>, obj) => {
            map[obj._id] = obj.toJSON()
            return map
          }, {})
          setTags(tagsAsMap)

          setIsReady(true)
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [db, setTags])

  return isReady
}

export const useTagsObservers = () => {
  const db = useDatabase()
  const [, setTags] = useRecoilState(normalizedTagsState)

  useEffect(() => {
    db?.tag.$.subscribe((changeEvent: RxChangeEvent<TagsDocType>) => {
      console.warn('CHANGE EVENT', changeEvent)
      switch (changeEvent.operation) {
        case 'INSERT': {
          return setTags(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData,
          }))
        }
        case 'UPDATE': {
          return setTags(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData,
          }))
        }
        case 'DELETE': {
          return setTags(({ [changeEvent.documentData._id]: deletedTag, ...rest }) => rest)
        }
      }
    })
  }, [db, setTags])
}