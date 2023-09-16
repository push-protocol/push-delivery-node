/**
 * Holds a mapping of
 * 'key' -> COUNTER
 *
 * i.e.
 * 'c' -> 3
 * 'b' -> 2
 * 'a' -> 1
 *
 *
 * and returns it in ascending/descending order
 *
 * Each value holds an additional context object, i.e. 'a' -> 1, [ incrementObject1, incrementObject2 ]
 *
 */

export class StringCounter<T> {
  map: Map<string, ValueHolder<T>> = new Map<string, ValueHolder<T>>()

  public increment(key: string, contextValue: T = null) {
    const holder = this.map.get(key)
    if (holder == null) {
      this.map.set(key, new ValueHolder(1, contextValue))
    } else {
      holder.value++ // using wrapper to avoid get/put
      holder.append(contextValue)
    }
  }

  public getValue(key: string): number {
    const holder = this.map.get(key)
    return holder == undefined ? null : holder.value
  }

  public getValueContext(key: string): T[] {
    const holder = this.map.get(key)
    return holder == undefined ? null : holder.incrementCtx
  }

  public iterateAndSort(
    asc: boolean,
    callback: (index: number, key: string, count: number, incrementCtx: T[]) => void
  ) {
    this.sort(asc)
    let i = 0
    for (const [key, valueHolder] of this.map) {
      callback(i++, key, valueHolder.value, valueHolder.incrementCtx)
    }
  }

  public getMostFrequentEntry(): ValueHolder<T> {
    const sortedMap = this.toSortedMap(false)
    for (const [key, valueHolder] of sortedMap.entries()) {
      return valueHolder
    }
    return null
  }

  public sort(asc: boolean) {
    this.map = this.toSortedMap(asc)
  }

  private toSortedMap(asc: boolean) {
    const sortedMap = new Map<string, ValueHolder<any>>(
      [...this.map].sort((a, b) => {
        // a[0] = key, a[1] = value
        if (a[1].value == b[1].value) return 0
        if (a[1].value > b[1].value) return asc ? 1 : -1
        if (a[1].value < b[1].value) return asc ? -1 : 1
      })
    )
    return sortedMap
  }
}

export class ValueHolder<V> {
  value: number
  incrementCtx: V[] = []

  constructor(value: number, contextValue: V) {
    this.value = value
    this.incrementCtx.push(contextValue)
  }

  append(contextValue: V) {
    this.incrementCtx.push(contextValue)
  }
}
