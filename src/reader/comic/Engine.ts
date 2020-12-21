import JSZip, { loadAsync } from 'jszip'
import { prop, sortBy } from 'ramda'
import { BehaviorSubject, Subject } from 'rxjs'
import { filter, first } from 'rxjs/operators'
import './style.css'

type Event = {
  name: string,
  cb: (data: any) => {}
}

export class Engine {
  protected container: HTMLElement | undefined
  protected files$ = new BehaviorSubject<JSZip.JSZipObject[] | undefined>(undefined)
  protected events: Event[] = []
  #jszip$ = new BehaviorSubject<JSZip | undefined>(undefined)
  protected wrapper: HTMLDivElement | undefined
  #actions$ = new Subject<{ name: 'display', data: any }>()
  protected _currentLocation: {
    start: {
      index: number,
      cfi: undefined | string,
      displayed: {
        page: number
      }
    },
    end: {}
  } = {
      start: {
        index: 0,
        cfi: undefined,
        displayed: {
          page: 1
        }
      },
      end: {}
    }

  /**
   * @fallback epubjs
   */
  public displayOptions = {
    fixedLayout: true
  }

  /**
   * @fallback epubjs
   */
  public packaging: {
    spine: {
      length: number,
      items: JSZip.JSZipObject[],
    },
    metadata: { layout: 'pre-paginated' }
  } = {
      spine: {
        items: [],
        length: 0,
      },
      metadata: {
        layout: 'pre-paginated'
      }
    }

  constructor() {
    this.files$.subscribe(files => console.log('ASDASDASD', files))
    this.#actions$
      .subscribe(action => {
        console.log('ASDASDASD', action)
        switch (action.name) {
          case 'display': {
            this.onDisplay(action.data)
            break;
          }
        }
      })
  }

  public renderTo = async (container: HTMLElement) => {
    this.container = container
  }

  public async load({ url }: { url: Blob }) {
    if (this.container) {
      const jszip = await loadAsync(url)
      const files = sortBy(prop('name'))(Object.values(jszip.files).filter(file => !file.dir))

      this.packaging.spine.items = files
      this.packaging.spine.length = files.length

      this.wrapper = this.container.ownerDocument.createElement('div')
      this.wrapper.className = 'comic-reader-wrapper'

      this.wrapper.addEventListener('click', clickEvent => {
        this.events.forEach(event => {
          if (event.name === 'click') {
            event.cb(clickEvent)
          }
        })
      })

      this.container?.appendChild(this.wrapper)

      this.#jszip$.next(jszip)
      this.files$.next(files)
    }

    return this
  }

  protected getFileFromLocation(location: string) {
    return (this.files$.value || []).find(file => file.name === location)
  }

  protected getCfiFromPercentage(value: number) {

  }

  protected async renderFile(file: JSZip.JSZipObject) {
    this.#jszip$
      .pipe(first())
      .subscribe(async (jszip) => {
        if (this.wrapper) {
          this.wrapper.innerHTML = ''
          const data = await jszip?.file(file.name)?.async('base64')
          const img = this.container?.ownerDocument.createElement('img')
          img?.setAttribute('src', `data:image/png;base64,${data}`)
          img && this.wrapper?.appendChild(img)

          const fileIndex = (this.files$.value || []).indexOf(file)
          this._currentLocation.start.displayed.page = fileIndex + 1
          this._currentLocation.start.index = fileIndex
          this._currentLocation.start.cfi = file.name

          this.trigger('relocated', this._currentLocation)
        }
      })
  }

  public on(eventName: string, cb: () => {}) {
    this.events.push({ name: eventName, cb })
  }

  public off(eventName: string, cb: () => {}) {
    this.events = this.events.filter(event => event.cb !== cb)
  }

  protected trigger(eventName: string, e: any) {
    this.events.forEach(event => {
      if (event.name === eventName) {
        event.cb(e)
      }
    })
  }

  public display(path?: string) {
    this.#actions$.next({ name: 'display', data: { path } })
  }

  protected onDisplay({ path }: { path?: string }) {
    this.files$
      .pipe(filter(value => value !== undefined))
      .pipe(first())
      .subscribe((files = []) => {
        if (this._currentLocation.start.cfi && this._currentLocation.start.cfi === path) return
        const defaultFile = files[0]
        if (path) {
          this.renderFile(this.getFileFromLocation(path) || defaultFile)
        } else {
          this.renderFile(defaultFile)
        }
      })
  }

  public getContents() {

  }

  public next() {
    const index = this._currentLocation.start.displayed.page - 1
    if (index < (this.files$.value || []).length - 1) {
      this.renderFile((this.files$.value || [])[index + 1])
    }
  }

  public prev() {
    const index = this._currentLocation.start.displayed.page - 1
    if (index > 0) {
      this.renderFile((this.files$.value || [])[index - 1])
    }
  }
}