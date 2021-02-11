import { isMobileDetected } from "./utils"

export const API_URI = process.env.REACT_APP_API_URL || `https://${window.location.hostname}:4000`
// export const API_URI = 'https://api.oboku.me'
export const API_SYNC_URL = `${API_URI}/sync`
// export const API_SYNC_URL = `https://localhost:4001/userdb-666f6f406261722e636f6d`
export const API_SYNC_POLL1_URL = `${process.env.REACT_APP_API_POLL_1_URL}/sync`
// export const API_SYNC_POLL1_URL = `https://localhost:4001/userdb-666f6f406261722e636f6d`
// export const API_SYNC_POLL_2_URL = `${process.env.REACT_APP_API_POLL_2_URL}/sync`
export const API_SYNC_POLL_2_URL = API_SYNC_URL
// export const API_URI = 'https://mbret-oboku-api.glitch.me/'
// export const API_URI = 'https://tough-walrus-50.loca.lt/'
export const DOWNLOAD_PREFIX = `book-download`

export const FIREBASE_BASE_CONFIG = {
  apiKey: "AIzaSyDJIkOKxOCf3WXrsPldQrEIY7LY237YSGU",
  authDomain: "oboku-api.firebaseapp.com",
  projectId: "oboku-api",
  storageBucket: "oboku-api.appspot.com",
  messagingSenderId: "325550353363",
  appId: "1:325550353363:web:a1c53e1b63fe56ac829d26",
  measurementId: "G-8HE2QKW24V"
}

export const IS_MOBILE_DEVICE = isMobileDetected()

export const ROUTES = {
  HOME: '/',
  BOOK_DETAILS: '/book/:id',
  COLLECTION_DETAILS: '/collection/:id',
  PROFILE: '/profile',
  SETTINGS: '/profile/settings',
  DATASOURCES: '/datasources',
  LIBRARY_ROOT: '/library',
  LIBRARY_BOOKS: '/library/books',
  LIBRARY_COLLECTIONS: '/library/collections',
  LIBRARY_TAGS: '/library/tags',
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth_callback',
  READER: '/reader/:id',
  SEARCH: '/search',
}