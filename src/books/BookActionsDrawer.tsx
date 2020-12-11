
import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { SyncRounded, DeleteForeverRounded, ListAltRounded, LibraryBooksRounded } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { useRemoveDownloadFile } from '../download/useRemoveDownloadFile';
import { ROUTES } from '../constants';
import { useRefreshBookMetadata } from './helpers';
import { useRemoveBook } from './helpers';
import { Drawer, Divider, ListItemIcon } from '@material-ui/core';
import { openManageBookCollectionsDialog } from './ManageBookCollectionsDialog';
import { atom, useRecoilCallback, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { enrichedBookState, normalizedBooksState } from './states';

export const bookActionDrawerState = atom<{ openedWith: undefined | string }>({ key: 'bookActionDrawerState', default: { openedWith: undefined } })

export const BookActionsDrawer = () => {
  const setOpenManageBookCollectionsDialog = useSetRecoilState(openManageBookCollectionsDialog)
  const [{ openedWith: bookId }, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)
  const history = useHistory()
  const book = useRecoilValue(enrichedBookState(bookId || '-1'))
  const removeDownloadFile = useRemoveDownloadFile()
  const removeBook = useRemoveBook()
  const refreshBookMetadata = useRefreshBookMetadata()

  const handleClose = () => {
    setBookActionDrawerState({ openedWith: undefined })
  };

  return (
    <Drawer
      anchor="bottom"
      open={!!bookId}
      onClose={handleClose}
      transitionDuration={0}
    >
      {book && (
        <>
          <List>
            <ListItem button
              onClick={() => {
                handleClose()
                history.push(ROUTES.BOOK_DETAILS.replace(':id', book._id))
              }}
            >
              <ListItemIcon>
                <ListAltRounded />
              </ListItemIcon>
              <ListItemText primary="Go to details" />
            </ListItem>
            <ListItem button
              onClick={() => {
                handleClose()
                refreshBookMetadata(book._id)
              }}
            >
              <ListItemIcon>
                <SyncRounded />
              </ListItemIcon>
              <ListItemText primary="Refresh metadata" />
            </ListItem>
            <ListItem button
              onClick={() => {
                handleClose()
                setOpenManageBookCollectionsDialog(bookId)
              }}
            >
              <ListItemIcon>
                <LibraryBooksRounded />
              </ListItemIcon>
              <ListItemText primary="Add or remove from collection" />
            </ListItem>
            {book.downloadState === 'downloaded' && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  bookId && removeDownloadFile(bookId)
                }}
              >
                <ListItemIcon>
                  <DeleteForeverRounded />
                </ListItemIcon>
                <ListItemText primary="Remove the book download" />
              </ListItem>
            )}
          </List>
          <Divider />
          <List>
            <ListItem button
              onClick={() => {
                handleClose()
                bookId && removeBook({ id: bookId })
              }}
            >
              <ListItemIcon>
                <DeleteForeverRounded />
              </ListItemIcon>
              <ListItemText primary="Remove from library" />
            </ListItem>
          </List>
        </>
      )}
    </Drawer>
  );
}