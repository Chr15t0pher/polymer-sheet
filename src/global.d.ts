declare interface Window {
  PolymerSheet: new (options: import('./declare').PolymerSheetOptions) => import('./ui/PolymerSheet').PolymerSheet
}

type Dictionary<T = any> = Record<string, T>
