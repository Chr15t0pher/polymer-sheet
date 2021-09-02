declare interface Window {
  PolymerSheet: new (options: import('./declare').PolymerSheetOptions) => import('./core/PolymerSheet').PolymerSheet
}

type Dictionary<T = any> = Record<string, T>
