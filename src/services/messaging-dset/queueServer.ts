// ------------------------------
// a queue, which is used to store an append only log;
// this node: appends it - if storage says yes to a new item
// other nodes: read this from client
import { Logger } from 'winston'
import { WinstonUtil } from '../../utilz/winstonUtil'
import { MySqlUtil } from '../../utilz/mySqlUtil'
import { Consumer, DCmd, QItem } from './queueTypes'
import StrUtil from '../../utilz/strUtil'
import { ObjectHasher } from '../../utilz/objectHasher'

export class QueueServer implements Consumer<QItem> {
  private log: Logger = WinstonUtil.newLog(QueueServer)
  replyPageSize = 10
  queueName: string
  storage: Consumer<QItem>

  constructor(
    localQueueName: string,
    replyPageSize: number,
    storageForDeduplication: Consumer<QItem> | null
  ) {
    this.queueName = localQueueName
    this.replyPageSize = replyPageSize
    this.storage = storageForDeduplication
  }

  /**
   * If we have storage: try adding to storage first
   * Otherwise insert into the queue.
   *
   * If an item has object_hash we will use that field at the db level
   * @param item
   */
  public async accept(item: QItem): Promise<boolean> {
    const cmd = item.object
    let valid = true
    if (this.storage != null) {
      valid = await this.storage.accept(item);
    }
    this.log.debug('[%s] try add %o', this.queueName, cmd)
    if (!valid) {
      this.log.debug(
        '[%s] item is already in the storage, skip adding to the queue',
        this.queueName
      )
      return false
    }
    let success
    if (StrUtil.isEmpty(item.object_hash)) {
      success = await this.appendDirect(cmd)
    } else {
      success = await this.appendWithHashChecks(item.object, item.object_hash)
    }
    this.log.debug('[%s] item pushed into the queue, success=%s', this.queueName, success)
    return success
  }

  /**
   * Append to queue, only if cmdHash is uniq to the underlying queue table
   * @param cmd
   * @param cmdHash
   */
  public async appendWithHashChecks(cmd: DCmd, cmdHash: string): Promise<boolean> {
    const cmdStr = JSON.stringify(cmd)
    /*
     note: IGNORE consumes all type of errors, so it is a very error prone keyword
     we will return true only if there are affected rows
     another option is to remove IGNORE and catch the exception
    */
    const res = await MySqlUtil.insert(
      `INSERT IGNORE INTO dset_queue_${this.queueName}(object, object_hash)
       VALUES (?, ?)`,
      cmdStr,
      cmdHash
    )
    return res.affectedRows === 1
  }

  /*
    Add directly to queue
     */
  public async appendDirect(cmd: DCmd) {
    const object = JSON.stringify(cmd)
    const objectHash = ObjectHasher.hashToSha256(cmd)
    const res = await MySqlUtil.insert(
      `INSERT INTO dset_queue_${this.queueName}(object)
       VALUES (?,?)`,
      object,
      objectHash
    )
    return res.affectedRows === 1
  }

  public async getFirstRowIdAfter(offset: number): Promise<number | null> {
    return await MySqlUtil.queryOneValue(
      `select min(id) as id
       from dset_queue_${this.queueName}
       where id > ?`,
      offset
    )
  }

  public async readItems(offset: number): Promise<QItem[]> {
    const rows = await MySqlUtil.queryArr<{ id: number; object: string; object_hash: string }>(
      `select id, object, object_hash
       from dset_queue_${this.queueName}
       where id > ?
       order by id asc
       limit ${this.replyPageSize} `,
      offset
    )
    const items: QItem[] = rows.map((row) => ({
      id: row.id,
      object: JSON.parse(row.object),
      object_hash: row.object_hash
    }))
    return items
  }

  public getPageSize(): number {
    return this.replyPageSize
  }

  public async getLastOffset(): Promise<number> {
    const row = await MySqlUtil.queryOneRow<{ lastOffset: number }>(
      `select max(id) as lastOffset
       from dset_queue_${this.queueName}
       limit 1`
    )
    return row == null ? 0 : row.lastOffset
  }

  public async readWithLastOffset(
    firstOffset: number
  ): Promise<{ items: QItem[]; lastOffset: number }> {
    const items = await this.readItems(firstOffset)
    let lastOffset
    if (items.length == 0) {
      // no items in the range and # of rows missing is more than a page size
      // ex: [1,2,3, 100,101,102] - missing ids from 4 to 99
      const nextId = await this.getFirstRowIdAfter(firstOffset)
      if (nextId == null) {
        // no more data in the table
        lastOffset = firstOffset
      } else {
        // for [100,101,102]
        // if data starts at [100] => firstOffset=99
        lastOffset = nextId - 1
      }
    } else {
      // some items are there, grab latest
      lastOffset = items[items.length - 1].id
    }
    return {
      items: items,
      lastOffset: lastOffset
    }
  }
}

export enum QueueServerMode {
  APPEND_TO_STORAGE_FIRST,
  ITEM,
  ITEM_WITH_HASH
}
