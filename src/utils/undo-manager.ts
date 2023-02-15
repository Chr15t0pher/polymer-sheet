const DEFAULT_CAPACITY = 50

export class UndoManager<T> {
  /** 待撤销项 */
  private undoes: T[] = []

  /** 待重做项 */
  private redoes: T[] = []

  private capacity!: number

  constructor(capacity: number = DEFAULT_CAPACITY) {
    this.capacity = capacity
  }

  canUndo() {
    return !!this.undoes.length
  }

  canRedo() {
    return !!this.redoes.length
  }

  addUndo(operation: T) {
    this.undoes.push(operation)

    return this
  }

  addRedo(operation: T) {
    this.redoes.push(operation)

    return this
  }

  record(operation: T) {
    this.redoes = []

    if (this.undoes.length === this.capacity) {
      this.undoes.shift()
    }

    this.addUndo(operation)

    return this
  }

  undo() {
    if (!this.canUndo) {
      return null
    }

    return this.undoes.pop() as T
  }

  redo() {
    if (!this.canRedo) {
      return null
    }

    return this.redoes.pop() as T
  }
}
