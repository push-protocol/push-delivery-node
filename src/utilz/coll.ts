// CollectionUtils
// all the proper type safe way to work with JS collections/sets/arrays
export class Coll {

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

  // [1,2,3] - [2,3] = [1]
  public static substractSet<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set([...set1].filter(x => !set2.has(x)));
  }

  // [1,2,3] x [2, 3] = [2,3]
  public static intersectSet<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set([...set1].filter(x => set2.has(x)));
  }

  // [1,2,3] x [2, 3] = [2,3]
  public static addSet<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set([...set1, ...set2]);
  }

  public static sortNumbersAsc(array: number[]) {
    if (array == null || array.length == 0) {
      return;
    }
    array.sort((a, b) => {
      return a - b;
    })
  }

  public static isEqualSet<T>(a: Set<T>, b: Set<T>) {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) {
        return false;
      }
    }
    return true;
  }

  // parse '[1,2,3]' into Set<number>: 1,2,3
  public static parseAsNumberSet(jsonArray: string): Set<number> {
    const arr: number[] = JSON.parse(jsonArray);
    return Coll.arrayToSet(arr);
  }

  // store set 1,2,3 as array: [1,2,3]
  public static numberSetToJson(s: Set<number>): string {
    return JSON.stringify([...s]);
  }

  // set 1,2,3 to sql: ('1','2','3')
  public static numberSetToSqlQuoted(s:Set<number>): string {
    return '(' + Coll.setToArray(s).map(num => "'" + num + "'").join(',') + ')';
  }
}
