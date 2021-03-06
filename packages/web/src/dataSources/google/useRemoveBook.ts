import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { extractIdFromResourceId, useGetLazySignedGapi } from "./helpers"

export const useRemoveBook: ObokuPlugin[`useRemoveBook`] = () => {
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return useCallback(
    async (link) => {
      try {
        const { gapi } = (await getLazySignedGapi()) || {}

        if (!gapi) throw new Error("Unable to authenticate")

        const fileId = extractIdFromResourceId(link.resourceId)

        await gapi.client.drive.files.delete({
          fileId
        })

        return { data: {} }
      } catch (e) {
        throw e
      }
    },
    [getLazySignedGapi]
  )
}
