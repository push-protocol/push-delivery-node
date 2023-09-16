import {Service} from "typedi";
import {WinstonUtil} from "../../utilz/winstonUtil";
import {Logger} from "winston";
import {Consumer, QItem} from "../messaging-dset/queueTypes";
import {MySqlUtil} from "../../utilz/mySqlUtil";
import {MessageBlock, MessageBlockUtil} from "../messaging-common/messageBlock";
import {ObjectHasher} from "../../utilz/objectHasher";

@Service()
export class BlockStorage {
  public log: Logger = WinstonUtil.newLog(BlockStorage);

  public async postConstruct() {
    await this.createTables();
  }

  async createTables() {
    await MySqlUtil.insert(`
      CREATE TABLE IF NOT EXISTS blocks
      (
        object_hash   VARCHAR(255) NOT NULL COMMENT 'optional: a uniq field to fight duplicates',
        object        MEDIUMTEXT   NOT NULL,
        PRIMARY KEY (object_hash)
      ) ENGINE = InnoDB
        DEFAULT CHARSET = utf8;
    `);

    await MySqlUtil.insert(`
      CREATE TABLE IF NOT EXISTS dset_client
      (
        id              INT          NOT NULL AUTO_INCREMENT,
        queue_name      varchar(32)  NOT NULL COMMENT 'target node queue name',
        target_node_id  varchar(128) NOT NULL COMMENT 'target node eth address',
        target_node_url varchar(128) NOT NULL COMMENT 'target node url, filled from the contract',
        target_offset   bigint(20)   NOT NULL DEFAULT 0 COMMENT 'initial offset to fetch target queue',
        state           tinyint(1)   NOT NULL DEFAULT 1 COMMENT '1 = enabled, 0 = disabled',
        PRIMARY KEY (id),
        UNIQUE KEY uniq_dset_name_and_target (queue_name, target_node_id)
      ) ENGINE = InnoDB
        DEFAULT CHARSET = utf8;
    `);
  }

  async accept(item: QItem): Promise<boolean> {
    let calculatedHash = item.object_hash;
    let dbHash = await MySqlUtil.queryOneValueOrDefault('SELECT object_hash FROM blocks where object_hash=?',
      -1, calculatedHash);
    if (dbHash > 0) {
      this.log.info('received block with hash %s, ' +
        'already exists in the storage, ignoring', dbHash);
      return false;
    }
    this.log.info('received block with hash %s, adding to the db', calculatedHash);
    const objectAsJson = JSON.stringify(item.object);
    const res = await MySqlUtil.insert(
      `INSERT
      IGNORE INTO blocks(object, object_hash) VALUES (?, ?)`,
      objectAsJson, calculatedHash);
    let requiresProcessing = res.affectedRows === 1;
    if (!requiresProcessing) {
      return false;
    }
    return true;
  }


}
