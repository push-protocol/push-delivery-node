import * as uuid from "uuid";

export default class IdUtil {

    public static getUuidV4(): string {
        return uuid.v4();
    }
}