
export enum AutoJoinPolicy {
  CUSTOM_CONTROLLER_SCOPED = 'custom_controller_scoped',
  TAB_AND_ORIGIN_SCOPED = 'tab_and_origin_scoped',
  ORIGIN_SCOPED = 'origin_scoped',
  PAGE_SCOPED = 'page_scoped'
}

export interface Options {
  autoJoinPolicy?: AutoJoinPolicy
  receiverApplicationId?: string
  language?: string
}

export class CastOptions {
  private _options: cast.framework.CastOptions
  constructor() {
    this._options = {
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
      receiverApplicationId: 'CC1AD845',
      language: 'en',
      resumeSavedSession: false
    }
  }

  setOptions(options: Options) {
    this._options = { ...this._options, ...options }
  }

  get options(): cast.framework.CastOptions {
    return this._options
  }
}
