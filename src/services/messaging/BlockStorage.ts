import {Service} from "typedi";
import {WinstonUtil} from "../../utilz/winstonUtil";
import {Logger} from "winston";
import {Consumer, QItem} from "../dset/queueTypes";
import {MySqlUtil} from "../../utilz/mySqlUtil";
import {MessageBlock, MessageBlockUtil} from "./messageBlock";

@Service()
export class BlockStorage {
  public log: Logger = WinstonUtil.newLog(BlockStorage);

  async accept(item: QItem): Promise<boolean> {
    let calculatedHash = item.object_hash;
    let rowId = await MySqlUtil.queryOneValueOrDefault('SELECT id FROM blocks where object_hash=?',
      -1, calculatedHash);
    if (rowId < 0) {
      this.log.info('received block with hash %s, ' +
        'already exists in the storage at index %d, ignoring',
        calculatedHash, rowId);
      return false;
    }
    this.log.info('received block with hash %s, adding to the db', calculatedHash);
    const res = await MySqlUtil.insert(
      `INSERT
      IGNORE INTO blocks(object, object_hash) VALUES (?, ?)`,
      item.object, item.object_hash);
    let requiresProcessing = res.affectedRows === 1;
    if (!requiresProcessing) {
      return false;
    }
    // do some processing
  }


}
