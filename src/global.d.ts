declare interface Window {
  PolymerSheet: new (options: PolymerSheetOptions) => import('./core/PolymerSheet').PolymerSheet
}

interface PolymerSheetOptions {
  containerId: string
  sheets: Array
  toolbarHeight?: number
}
