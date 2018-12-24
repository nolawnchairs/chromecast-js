
export declare type QueueEventType = 'queueLoad'
  | 'queueStart'
  | 'queueComplete'
  | 'queueInsert'
  | 'queueRemove'
  | 'queueItem'

export default class Queue {

  private _started: boolean = false
  private _items: chrome.cast.media.QueueItem[] = []

  get started(): boolean {
    return this._started
  }

  get items(): chrome.cast.media.QueueItem[] {
    return this._items
  }

  start() {
    this._started = true
  }

  add(items: chrome.cast.media.QueueItem[], media?: chrome.cast.media.Media): Promise<void> {
    return new Promise((resolve, reject) => {
      items.forEach(i => this._items.push(i))
      if (this._started && !!media) {
        const req = new chrome.cast.media.QueueInsertItemsRequest(items)
        media.queueInsertItems(req, resolve, reject)
      } else {
        resolve()
      }
    })
  }

  append(item: chrome.cast.media.QueueItem, media?: chrome.cast.media.Media): Promise<void> {
    return this.add([item], media)
  }

  removeItem(itemId: number, media?: chrome.cast.media.Media): Promise<void> {
    return new Promise((resolve, reject) => {
      this._items = this._items.splice(itemId, 1)
      if (this._started && !!media) {
        media.queueRemoveItem(itemId, resolve, reject)
      } else {
        resolve()
      }
    })
  }

  reorderItems(items: number[], media: chrome.cast.media.Media, before?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = new chrome.cast.media.QueueReorderItemsRequest(items)
      const success = () => {
        this._items = media.items
        resolve()
      }
      if (!!before)
        req.insertBefore = before
      media.queueReorderItems(req, success, reject)
    })
  }
}
