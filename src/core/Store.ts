const store = {
  containerId: 'polymer_sheet',

  sheets: [],

  toolbarHeight: 42,

  rowHeaderWidth: 20,
  columnHeaderHeight: 20,

  scrollbarSize: 12,

  contentWidth: 0,
  contentHeight: 0,

  bottomBarHeight: 42,

  devicePixelRatio: 1,
}

export type Store = typeof store

export default store
