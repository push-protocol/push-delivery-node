export class NumUtil {
  public static parseInt(val: string | number | null, defaultValue: number): number {
    if (val === null) {
      return defaultValue
    }
    const valN = typeof val === 'string' ? Number(val) : val
    if (isNaN(valN)) {
      return defaultValue
    }
    return Number.isInteger(valN) ? valN : Math.round(valN)
  }

  public static toString(value: number) {
    if (value == null) {
      return ''
    }
    return '' + value
  }
}
