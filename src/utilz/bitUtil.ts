export class BitUtil {
  /**
   * XORs 2 buffers, byte by byte: src = src XOR add
   * 1 modifies src
   * 2 returns srs || src's resized copy in case there is no room for add bytes
   *
   * @param src
   * @param add
   */
  public static xor(src: Buffer, add: Buffer): Buffer {
    if (src == null && add == null) {
      return Buffer.alloc(0)
    } else if (add == null) {
      return src
    } else if (src == null) {
      src = new Buffer(add.length)
      add.copy(src, 0, 0, add.length)
      return src
    }
    let target = src
    if (add.length > src.length) {
      target = new Buffer(add.length)
      src.copy(target, 0, 0, src.length)
    }
    var length = Math.min(target.length, add.length)
    for (var i = 0; i < length; ++i) {
      target[i] = target[i] ^ add[i]
    }
    return target
  }

  public static strToBase64(value: string): string {
    return Buffer.from(value).toString('base64')
  }

  public static base64ToStr(value: string): string {
    return Buffer.from(value, 'base64').toString('utf8')
  }
}
