import { generateResourceResponse } from "@oboku/reader-streamer"
import { useEffect } from "react"
import { useCallback, useState } from "react"
import { getBookFile } from "../../download/useBookFile"
import { PromiseReturnType } from "../../types"
import { getArchiveForRarFile } from "./getArchiveForFile"

export const useRarStreamer = (bookId: string | undefined) => {
  const [archive, setArchive] = useState<PromiseReturnType<typeof getArchiveForRarFile> | undefined>()

  useEffect(() => {
    let cancelled = false

    if (!bookId) {
      setArchive(undefined)
    }
    (async () => {
      if (bookId) {
        const file = await getBookFile(bookId)
        if (file) {
          const archive = await getArchiveForRarFile(file)
          if (!cancelled) {
            setArchive(archive)
          }
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [bookId])

  useEffect(() => () => {
    setArchive(undefined)
  }, [])

  // @todo make it cancellable
  const fetchResource = useCallback(async (item) => {
    if (archive) {
      return (await generateResourceResponse(archive, item.path)).text()
    }
    return ''
  }, [archive])

  return { fetchResource: archive ? fetchResource : undefined }
}