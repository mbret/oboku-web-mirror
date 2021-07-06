import { Archive, createArchiveFromJszip, createArchiveFromText } from "@oboku/reader-streamer";
import { createArchiveFromArrayBufferList } from "@oboku/reader-streamer";
import { loadAsync } from "jszip";
import { RarArchive } from "../../archive/types";
import { getBookFile } from "../../download/useBookFile";
import { PromiseReturnType } from "../../types";

const epubMimeTypes = ['application/epub+zip']

export const getArchiveForFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>): Promise<Archive | undefined> => {

  const normalizedName = file.name.toLowerCase()

  if (
    normalizedName.endsWith(`.epub`)
    || normalizedName.endsWith(`.cbz`)
    || epubMimeTypes.includes(file.data.type)
  ) {
    return getArchiveForZipFile(file)
  }

  if (normalizedName.endsWith(`.txt`)) {
    return createArchiveFromText(file.data)
  }

  return undefined
}

const getArchiveForZipFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>) => {
  const jszip = await loadAsync(file.data)

  return createArchiveFromJszip(jszip, { orderByAlpha: true })
}

/**
 * Does not work within service worker context yet.
 * Library use XhtmlHttpRequest which exist in worker and main thread but not SW.
 * We fallback to app main thread for rar archives
 */
export const getArchiveForRarFile = async (file: NonNullable<PromiseReturnType<typeof getBookFile>>) => {
  return new Promise<Archive>((masterResolve, reject) => {
    try {
      // @ts-ignore
      loadArchiveFormats(['rar'], async () => {
        try {
          // @ts-ignore
          const rarArchive: RarArchive = await archiveOpenFile(file.data, undefined)

          const archive = await createArchiveFromArrayBufferList(
            rarArchive.entries.map(file => ({
              isDir: !file.is_file,
              name: file.name,
              size: file.size_uncompressed,
              data: () => new Promise<ArrayBuffer>((resolve, reject) => {
                file.readData((data, error) => {
                  if (error) return reject(error)
                  resolve(data)
                })
              })
            })),
            { orderByAlpha: true }
          )

          masterResolve(archive)
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      return reject(e)
    }
  })

}