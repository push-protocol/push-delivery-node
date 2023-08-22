export class CollectionUtil {
  public static arrayToMap<K extends keyof V, V>(arr: V[], keyField: K): Map<V[K], V> {
    if (arr == null || arr.length == 0) {
      return new Map()
    }
    return new Map<V[K], V>(arr.map((value) => [value[keyField], value]))
  }

  public static arrayToSet<V>(arr: V[]): Set<V> {
    return new Set<V>(arr)
  }

  public static arrayToFields<K extends keyof V, V>(arr: V[], keyField: K): Set<V[K]> {
    const arrayOfFields = arr.map((obj) => obj[keyField])
    return new Set(arrayOfFields)
  }

  public static findIndex<V>(arr: V[], filter: (item: V) => boolean): number {
    if (arr == null) {
      return -1
    }
    return arr.findIndex(filter)
  }

  public static setToArray<V>(set: Set<V>): V[] {
    return Array.from(set.keys())
  }
}
