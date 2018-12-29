
/**
 * This class is not used until I can find a way to
 * implement the Cast API's queuing mechanism that properly
 * updates
 */

/**
 * @deprecated
 */
export default class Queue {

  private _started: boolean = false
  private _items: chrome.cast.media.QueueItem[] = []
  private _queuedItemMapping: number[] = []
  private _currentItemId: number = 0
  private _currentQueueIndex: number = 0

  get started(): boolean {
    return this._started
  }

  get items(): chrome.cast.media.QueueItem[] {
    return this._items
  }

  get currentItemId(): number {
    return this._currentItemId
  }

  get currentQueueIndex(): number {
    return this._currentQueueIndex
  }

  get length(): number {
    return this._queuedItemMapping.length
  }

  start(mediaSession: chrome.cast.media.Media) {
    this._started = true
    this._currentItemId = mediaSession.currentItemId
  }

  add(items: chrome.cast.media.QueueItem[]) {
    items.forEach((item, i) => {
      this._items.push(item)
      this._queuedItemMapping.push(i + 1)
    })
  }

  append(item: chrome.cast.media.QueueItem, media: chrome.cast.media.Media): Promise<void> {
    return new Promise((resolve, reject) => {
      const success = () => {
        this._items.push(item)
        this._queuedItemMapping.push(Math.max(...this._queuedItemMapping) + 1)
        this.debug(media)
        resolve()
      }
      const req = new chrome.cast.media.QueueInsertItemsRequest([item])
      media.queueInsertItems(req, success, reject)
    })
  }

  removeItem(queueId: number, media: chrome.cast.media.Media): Promise<void> {
    return new Promise((resolve, reject) => {
      const success = () => {
        console.log('succeded in removing item %d', queueId)
        this._items.splice(queueId, 1)
        this._queuedItemMapping.splice(queueId, 1)
        console.log('current id is %d', this._currentItemId)
        console.log(this._queuedItemMapping, this._items.map(i => i.media.contentId))
        resolve()
      }

      const itemId = this._queuedItemMapping[queueId]
      media.queueRemoveItem(itemId, success, reject)

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

  /**
   * Sets the current itemId and currentQueueIndex
   * @param id current queue itemId as described by the cast API
   */
  setCurrentItemId(id: number) {
    this._currentItemId = id
    this._currentQueueIndex = this.findQueueIndex(id)
  }

  /**
   * Find the zero-indexed queue index from the itemId of the cast media session
   * @param mediaItemId current queue item id as described by the cast API
   */
  findQueueIndex(mediaItemId: number): number {
    const t = this._queuedItemMapping.indexOf(mediaItemId)
    if (t > -1)
      return this._items.findIndex(($, i) => i == t)
  }

  /**
   * Clears the local queue information
   */
  clear() {
    this._queuedItemMapping = []
    this._items = []
  }

  drain() {

  }

  debug(media: chrome.cast.media.Media) {
    const items = media.items.map(i => `${i.itemId}: ${i.media.contentId}`)
    console.log(items)
  }
}
