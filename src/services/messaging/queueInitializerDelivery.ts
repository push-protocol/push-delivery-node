import {Inject, Service} from 'typedi'
import {MySqlUtil} from '../../utilz/mySqlUtil'
import {Logger} from 'winston'
import schedule from 'node-schedule'
import {ValidatorContractState} from '../messaging/validatorContractState'
import {WinstonUtil} from '../../utilz/winstonUtil'
import {QueueServer} from '../dset/queueServer'
import {QueueClient} from '../dset/queueClient'
import DeliveryNode from "./deliveryNode";


@Service()
export class QueueInitializerDelivery {
  public log: Logger = WinstonUtil.newLog(QueueInitializerDelivery)

  @Inject((type) => ValidatorContractState)
  private contractState: ValidatorContractState;
  @Inject()
  private deliveryNode:DeliveryNode;


  // PING: schedule
  private readonly CLIENT_READ_SCHEDULE = '*/30 * * * * *'

  public static QUEUE_MBLOCK = 'mblock'
  mblockQueue: QueueServer
  mblockClient: QueueClient

  constructor() {}

  private readonly QUEUE_REPLY_PAGE_SIZE = 10
  private readonly CLIENT_REQUEST_PER_SCHEDULED_JOB = 10

  // client -> queue -?-> channelService -> table <------- client
  public async postConstruct() {
    this.log.debug('postConstruct')
    this.mblockClient = new QueueClient(this.deliveryNode, QueueInitializerDelivery.QUEUE_MBLOCK)
    await this.initClientForEveryQueueForEveryValidator()
    const qs = this
    schedule.scheduleJob(this.CLIENT_READ_SCHEDULE, async function () {
      const dbgPrefix = 'PollRemoteQueue'
      try {
        await qs.mblockClient.pollRemoteQueue(qs.CLIENT_REQUEST_PER_SCHEDULED_JOB)
        qs.log.info(`CRON %s started`, dbgPrefix);
      } catch (err) {
        qs.log.error(`CRON %s failed %o`, dbgPrefix, err);
      } finally {
        qs.log.info(`CRON %s finished`, dbgPrefix);
      }
    })
  }

  // updates the dset_client table used for queries according to the contract data
  private async initClientForEveryQueueForEveryValidator() {
    const queueArr = await MySqlUtil.queryArr<{ queue_name: string }>(`select queue_name
                                                                       from dset_server`)
    const nodeId = this.contractState.nodeId
    const allValidators = this.contractState.getAllValidatorsExceptSelf()
    for (const queueRow of queueArr) {
      const queueName = queueRow.queue_name
      for (const nodeInfo of allValidators) {
        const targetNodeId = nodeInfo.nodeId
        const targetNodeUrl = nodeInfo.url
        const targetState = ValidatorContractState.isEnabled(nodeInfo) ? 1 : 0
        await MySqlUtil.insert(
          `INSERT INTO dset_client (queue_name, target_node_id, target_node_url, target_offset, state)
           VALUES (?, ?, ?, 0, ?)
           ON DUPLICATE KEY UPDATE target_node_url=?,
                                   state=?`,
          queueName,
          targetNodeId,
          targetNodeUrl,
          targetState,
          targetNodeUrl,
          targetState
        )
        const targetOffset = await MySqlUtil.queryOneValue<number>(
          `SELECT target_offset
           FROM dset_client
           where queue_name = ?
             and target_node_id = ?`,
          queueName,
          targetNodeId
        )
        this.log.info(
          'client polls (%s) queue: %s node: %s from offset: %d ',
          targetState,
          queueName,
          targetNodeId,
          targetOffset
        )
      }
    }
  }

  public getQueue(queueName: string): QueueServer {
    if (queueName == 'subscribers') {
      return this.mblockQueue
    }
    throw new Error('invalid queue')
  }

  public async listServers(): Promise<any> {
    const result: string[] = []
    const rows = await MySqlUtil.queryArr<{ queue_name: string }>(
      'select queue_name from dset_server'
    )
    for (const r of rows) {
      result.push(r.queue_name)
    }
    return { result: result }
  }

  public async getQueueLastOffset(queueName: string): Promise<any> {
    const lastOffset = await this.getQueue(queueName).getLastOffset()
    return { result: lastOffset }
  }

  public async expectValidQueueName(queueName: string): Promise<void> {
    const obj = await MySqlUtil.queryOneRow<{ dset_name }>(
      'select queue_name from dset_server ' + 'where queue_name=?',
      queueName
    )
    if (obj == null) {
      return Promise.reject('no dset found')
    }
    return Promise.resolve()
  }

  public async readItems(dsetName: string, firstOffset: number){
    const q = this.getQueue(dsetName)
    return await q.readWithLastOffset(firstOffset);
  }

  public async pollRemoteQueues(): Promise<any> {
    const result = await this.mblockClient.pollRemoteQueue(1)
    return result
  }
}


