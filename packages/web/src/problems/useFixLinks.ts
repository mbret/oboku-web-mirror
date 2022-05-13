import { mergeWith } from "ramda"
import { useCallback } from "react"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"

export const useFixLinks = () => {
  const database = useDatabase()

  return useCallback(
    async (data: [string, { name: string; number: number }][]) => {
      const yes = window.confirm(
        `
                This action will merge links that uses the same resourceId.
                We will try to use a non destructive merge by keeping defined properties when possible. 
                You may want to re-sync after the operation to restore value with their latest state.
                `.replace(/  +/g, "")
      )

      if (yes && database) {
        try {
          await Promise.all(
            data.map(async ([resourceId]) => {
              const docsWithSameResourceId = await database?.link
                .find({ selector: { resourceId: resourceId ?? `-1` } })
                .exec()

              const dataAsJson = docsWithSameResourceId.map((document) =>
                document.toJSON()
              )

              const booksToReattachToMergedLink = dataAsJson
                .map((data) => data.book)
                .filter((id) => !!id) as string[]

              const mergedDoc = dataAsJson.reduce(
                (previous, current) =>
                  // we use || to be as less destructive as possible
                  mergeWith((a, b) => b || a, previous, current),
                dataAsJson[0]
              )

              if (!mergedDoc) return

              const { _id, _rev, ...safeMergedDoc } = mergedDoc

              // we update the first entry with the all merged data
              await docsWithSameResourceId[0]?.atomicUpdate((oldData) => ({
                ...oldData,
                ...safeMergedDoc
              }))

              // then we make sure each book is attached to the correct link
              const bookDocs = await database.book
                .find({
                  selector: { _id: { $in: booksToReattachToMergedLink } }
                })
                .exec()

              await Promise.all(
                bookDocs.map(async (doc) => {
                  await doc.atomicUpdate((old) => ({
                    ...old,
                    links: [...new Set([...old.links, mergedDoc._id])]
                  }))
                })
              )

              // if all books has been successfully updated we can now delete dangling links
              // then we remove all the other documents
              await Promise.all(
                docsWithSameResourceId
                  .slice(1)
                  .map(async (document) => document.remove())
              )
            })
          )
        } catch (e) {
          Report.error(e)
        }
      }
    },
    [database]
  )
}
