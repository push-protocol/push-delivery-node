import StrUtil from './strUtil'

export class EthUtil {
  static parseCaipAddress(addressinCAIP: string): CaipAddr | null {
    if (StrUtil.isEmpty(addressinCAIP)) {
      return null
    }
    const addressComponent = addressinCAIP.split(':')
    if (addressComponent.length === 3) {
      return {
        namespace: addressComponent[0],
        chainId: addressComponent[1],
        addr: addressComponent[2]
      }
    } else if (addressComponent.length === 2) {
      return {
        namespace: addressComponent[0],
        chainId: null,
        addr: addressComponent[1]
      }
    } else {
      return null
    }
  }
}

// ex: eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681
export class CaipAddr {
  // ex: eip155
  namespace: string
  // ex: 5
  chainId: string | null
  // ex: 0xD8634C39BBFd4033c0d3289C4515275102423681
  addr: string
}
