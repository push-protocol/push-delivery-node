import { DateTime } from 'ts-luxon'

export default class DateUtil {
  public static formatYYYYMMDD(yearValue: number, monthValue: number, dayValue: number): string {
    return DateTime.fromObject({ year: yearValue, month: monthValue, day: dayValue }).toFormat(
      'yyyyMMdd'
    )
  }

  public static formatYYYYMMDDEx(dt: DateTime): string {
    return dt.toFormat('yyyyMMdd')
  }

  public static formatYYYYMM(dt: DateTime): string {
    return dt.toFormat('yyyyMM')
  }

  public static buildDateTime(yearValue: number, monthValue: number, dayValue: number): DateTime {
    return DateTime.fromObject({ year: yearValue, month: monthValue, day: dayValue })
  }

  // example: 1661214142.000000
  public static parseUnixFloatAsDouble(timestamp: string): number {
    return Number.parseFloat(timestamp)
  }

  // example: 1661214142
  public static parseUnixFloatAsInt(timestamp: string): number {
    return Math.floor(Number.parseFloat(timestamp))
  }

  public static parseUnixFloatAsDateTime(timestamp: string): DateTime {
    return DateTime.fromMillis(Number.parseFloat(timestamp) * 1000)
  }

  public static dateTimeToUnixFloat(dt: DateTime): number {
    return dt.toMillis() / 1000.0
  }

  public static currentTimeMillis(): number {
    return new Date().getTime()
  }

  public static currentTimeSeconds(): number {
    return Math.round(new Date().getTime() / 1000)
  }

  public static millisToDate(timestamp: number): Date {
    return new Date(timestamp)
  }

  public static millisToUnixSeconds(timestamp: number): number {
    return Math.round(timestamp / 1000)
  }
}
