import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import PouchDB from "pouchdb"
import { first } from "rxjs/operators"
import { authState } from "../auth/authState"
import { useAxiosClient } from "../axiosClient"
import { API_COUCH_URI } from "../constants"
import { RxCollection } from "rxdb"
import { syncCollections } from "./replication/syncCollections"
import { merge, filter, map } from "rxjs"

export const useSync = () => {
  const client = useAxiosClient()
  const { dbName } = useRecoilValue(authState) || {}

  return useCallback(
    (collections: RxCollection[]) => {
      const syncOptions = () => ({
        remote: new PouchDB(`${API_COUCH_URI}/${dbName}`, {
          fetch: (url, opts) => {
            ;(opts?.headers as unknown as Map<string, string>).set(
              "Authorization",
              client.getAuthorizationHeader()?.toString() || ``
            )
            return PouchDB.fetch(url, opts)
          }
        }),
        direction: {
          push: true
        },
        options: {
          retry: false,
          live: false,
          timeout: 5000
        }
      })

      const state = syncCollections(collections, syncOptions)

      return merge(
        state.error$.pipe(
          map((error) => {
            throw error
          })
        ),
        state.complete$.pipe(
          filter((value) => value === true),
          first()
        )
      )
    },
    [client, dbName]
  )
}
