export default class StrUtil {

    public static isEmpty(s: string): boolean {
        if (s == null) {
            return true;
        }
        if (typeof s !== 'string') {
            return false;
        }
        return s.length === 0
    }

    public static isHex(s: string): boolean {
        if (StrUtil.isEmpty(s)) {
            return false;
        }
        let pattern = /^[A-F0-9]+$/i;
        let result = pattern.test(s);
        return result;
    }

    /**
     * Return s if this is not empty, defaultValue otherwise
     * @param s
     * @param defaultValue
     */
    public static getOrDefault(s: string, defaultValue: string) {
        return StrUtil.isEmpty(s) ? defaultValue : s;
    }

    public static toStringDeep(obj: any): string {
        return JSON.stringify(obj, null, 4);
    }

    // https://ethereum.stackexchange.com/questions/2045/is-ethereum-wallet-address-case-sensitive
    public static normalizeEthAddress(addr: string): string {
        return addr;
    }
}