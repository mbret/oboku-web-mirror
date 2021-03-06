import { ComponentProps } from "react"
import Chip from "@mui/material/Chip"
import { useRecoilValue } from "recoil"
import { tagState } from "./states"

export const TagChip = ({
  id,
  ...rest
}: { id: string } & ComponentProps<typeof Chip>) => {
  const { name } = useRecoilValue(tagState(id)) || {}

  return <Chip label={name} {...rest} />
}
