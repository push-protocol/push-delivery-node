import StrUtil from './strUtil'

export class Check {
  public static isTrue(condition: any, err?: string) {
    if (!condition) {
      throw new Error(StrUtil.isEmpty(err) ? 'Assertion failed' : err)
    }
  }

  public static notNull(condition: any, err?: string) {
    if (condition == null) {
      throw new Error(StrUtil.isEmpty(err) ? 'Null check failed' : err)
    }
  }

  public static notEmpty(value: string, err?: string) {
    if (StrUtil.isEmpty(value)) {
      throw new Error(StrUtil.isEmpty(err) ? 'Str empty check failed' : err)
    }
  }

  public static notEmptyArr(value: any[], err?: string) {
    if (value == null || value.length == 0) {
      throw new Error(StrUtil.isEmpty(err) ? 'Str empty check failed' : err)
    }
  }
}
