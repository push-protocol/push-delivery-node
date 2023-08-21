// abstract item, can be anything
import {MySqlUtil} from "../../utilz/mySqlUtil";
import {ValidatorContractState} from "../messaging/validatorContractState";

export interface QItem {
  id: number; // this is queue index, 0-based number, always grows
  object_hash?: string;
  object: DCmd;
}

// abstract command, only for type checks
export interface DCmd {
}

export interface Consumer<T> {
  accept(item: T): Promise<boolean>
}
