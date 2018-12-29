
export declare type QueueEventType = 'queueStart'
  | 'queueComplete'
  | 'queueInsert'
  | 'queueRemove'
  | 'queueItem'
  | 'queueUpdate'

enum ItemChangeActor { Automatic, User }

export default class MediaQueue {

  private _started: boolean = false
  private _items: chrome.cast.media.MediaInfo[] = []
  private _currentItem: number = -1
  private _nextActor: ItemChangeActor = ItemChangeActor.Automatic

  /**
   * Whether or not the queue has been started
   */
  get started(): boolean {
    return this._started
  }

  /**
   * Get all queued items
   */
  get items(): chrome.cast.media.MediaInfo[] {
    return this._items
  }

  /**
   * Get the length of item array
   */
  get length(): number {
    return this._items.length
  }

  /**
   * Get the currently playing item index
   */
  get currentItem(): number {
    return this._currentItem
  }

  /**
   * Get the currently playing item
   */
  get current(): chrome.cast.media.MediaInfo {
    return this._items[this._currentItem]
  }

  /**
   * Set queue as started
   */
  start() {
    this._started = true
    this._currentItem = 0
  }

  /**
   * Get whether or not next queue item is
   * user-requested or automatic
   */
  isNextItemUserSelected(): boolean {
    return this._nextActor == ItemChangeActor.User
  }

  /**
   * Set whether or not next item is a user action
   * @param is is a user action
   */
  setNextItemUserSelected(is: boolean) {
    this._nextActor = is ? ItemChangeActor.User : ItemChangeActor.Automatic
  }

  /**
   * Set queue as completed
   * @param clear whether or not to reset the queue
   */
  end(clear?: boolean) {
    this._started = false
    if (clear)
      this.clear()
  }

  /**
   * Returns the next item in the queue and advances
   * the current item cursor
   * @nullable
   */
  next(isUserAction: boolean = false): chrome.cast.media.MediaInfo | null {
    if (this._currentItem < this.length) {
      const nextItem = this._currentItem + 1
      this._currentItem = nextItem
      if (isUserAction)
        this._nextActor = ItemChangeActor.User
      return this._items[nextItem]
    }
    return null
  }

  /**
   * Returns the previous item in the queue and rewinds
   * the current item cursor
   * @nullable
   */
  previous(): chrome.cast.media.MediaInfo | null {
    if (this._currentItem > 0) {
      const nextItem = this._currentItem - 1
      this._currentItem = nextItem
      this._nextActor = ItemChangeActor.User
      return this._items[nextItem]
    }
    return null
  }

  /**
   * Remove all items that come after
   * the currently playing item
   */
  drain() {
    this._items.splice(this._currentItem + 1, this._items.length - this._currentItem)
  }

  /**
   * Reset the queue
   */
  clear() {
    this._started = false
    this._currentItem = -1
    this._items = []
  }

  /**
   * Add items to the queue
   * @param items array of MediaInfo items
   */
  add(items: chrome.cast.media.MediaInfo[]) {
    this._items.push(...items)
  }

  /**
   * Append an item to the queue
   * @param item MediaInfo item
   */
  append(item: chrome.cast.media.MediaInfo) {
    this._items.push(item)
  }

  /**
   * Remove an item from the queue
   * @param id index of queue item
   */
  removeItem(id: number): boolean {
    this._items.splice(id, 1)
    return id == this._currentItem
  }

  /**
   * Moves a queue item from one position to another
   * @param from index of item being moved
   * @param to index to place the moved item
   */
  reorderItem(from: number, to: number) {
    this._items.splice(to, 0, ...this._items.splice(from, 1))
  }
}
