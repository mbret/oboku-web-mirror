import * as dropboxConstants from "./dropbox/constants"
import { UploadBook as UploadBookFromDropbox } from "./dropbox/UploadBook"
import { ReactComponent as DropboxIconAsset } from "../assets/dropbox.svg"
import { useGetCredentials as useGetDropboxCredentials } from "./dropbox/helpers"
import * as dropboxPlugin from "./dropbox"
import { plugin as google } from "./google"
import linkPlugin from "./link"
import { ObokuPlugin } from "@oboku/plugin-front"
import { plugin as imhentai } from "@oboku/plugin-imhentai-front"
import { SvgIcon } from "@mui/material"

const plugins: ObokuPlugin[] = []

const DropboxIcon = () => (
  <SvgIcon>
    <DropboxIconAsset />
  </SvgIcon>
)

plugins.push({
  uniqueResourceIdentifier: dropboxConstants.UNIQUE_RESOURCE_IDENTIFIER,
  type: `DROPBOX`,
  name: "Dropbox",
  Icon: DropboxIcon,
  UploadComponent: UploadBookFromDropbox,
  AddDataSource: dropboxPlugin.AddDataSource,
  useGetCredentials: useGetDropboxCredentials,
  useDownloadBook: dropboxPlugin.useDownloadBook,
  useRemoveBook: dropboxPlugin.useRemoveBook,
  synchronizable: true
})

plugins.push(google)
plugins.push(linkPlugin)
plugins.push(imhentai)

export { plugins }
