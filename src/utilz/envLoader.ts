import dotenv from 'dotenv';
import StrUtil from "./strUtil";

export default class EnvLoader {

    public static loadEnvOrFail() {
        const envFound = dotenv.config();
        if (envFound.error) {
            // This error should crash whole process
            throw new Error("⚠️  Couldn't find .env file  ⚠️");
        }
    }

    public static getPropertyOrFail(propName:string):string {
        let val = process.env[propName];
        if(StrUtil.isEmpty(val)) {
            throw new Error(`process.env.${propName} is empty`);
        }
        return val;
    }
}