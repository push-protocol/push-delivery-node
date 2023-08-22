// ------------------------------
// reads other node queue fully, appends everything to the local queue/storage
import { Logger } from 'winston'
import { WinstonUtil } from '../../utilz/winstonUtil'
import { MySqlUtil } from '../../utilz/mySqlUtil'
import axios from 'axios'
import { Consumer, QItem } from './queueTypes'

export class QueueClient {
  public log: Logger = WinstonUtil.newLog(QueueClient)
  // remoteUrl: string // stored into db
  // offset: number // stored into db
  consumer: Consumer<QItem>
  queueName: string

  constructor(consumer: Consumer<QItem>, remoteQueueName: string) {
    this.consumer = consumer
    this.queueName = remoteQueueName
  }

  /**
   * Call in cycle until it returns true,
   * fetches maxRequests at max per each invocation per each endpoint
   * @param maxRequests
   * @returns true, if no more data available; false otherwise
   */
  public async pollRemoteQueue(maxRequests: number): Promise<any> {
    const result = []
    const sameQueueEndpoints = await MySqlUtil.queryArr<{
      id: number
      queue_name: string
      target_node_id: string
      target_node_url: string
      target_offset: number
    }>(
      `select id, queue_name, target_node_id, target_node_url, target_offset
       from dset_client
       where queue_name = ?
         and state = 1
       order by id asc`,
      this.queueName
    )
    for (const endpoint of sameQueueEndpoints) {
      // todo EVERY ENDPOINT CAN BE DONE IN PARALLEL
      // read data from the endpoint (in cycle) , update the offset in db
      const endpointStats = {
        queueName: this.queueName,
        target_node_id: endpoint.target_node_id,
        target_node_url: endpoint.target_node_url,
        queries: 0,
        downloadedItems: 0,
        newItems: 0,
        lastOffset: endpoint.target_offset
      }
      let lastOffset = endpoint.target_offset
      for (let i = 0; i < maxRequests; i++) {
        result.push(endpointStats)
        endpointStats.queries++
        const reply = await this.readItems(
          endpoint.queue_name,
          endpoint.target_node_url,
          lastOffset
        )
        if (!reply || reply.items?.length == 0) {
          break
        }
        for (const item of reply.items) {
          endpointStats.downloadedItems++
          const appendSuccessful = await this.consumer.accept(item)
          if (appendSuccessful) {
            endpointStats.newItems++
          }
        }
        await MySqlUtil.update(
          'UPDATE dset_client SET target_offset=? WHERE id=?',
          reply.lastOffset,
          endpoint.id
        )
        lastOffset = reply.lastOffset
        endpointStats.lastOffset = reply.lastOffset
      }
    }
    return {
      result: result
    }
  }

  public async readItems(
    queueName: string,
    baseUri: string,
    firstOffset: number = 0
  ): Promise<{ items: QItem[]; lastOffset: number } | null> {
    const url = `${baseUri}/apis/v1/dset/queue/${queueName}?firstOffset=${firstOffset}`
    try {
      const re = await axios.get(url, {
        timeout: 3000
        // signal: AbortSignal.timeout(3000)
      })
      this.log.debug('readItems %s from offset %d %o', url, firstOffset, re?.data)
      const obj: { items: QItem[]; lastOffset: number } = re.data
      return obj
    } catch (e) {
      this.log.warn('readItems failed for url %s', url)
      return null
    }
  }

  public async readLastOffset(queueName: string, baseUri: string): Promise<number> {
    const url = `${baseUri}/api/v1/dset/queue/${queueName}/lastOffset`
    const resp: { result: number } = await axios.get(url, { timeout: 3000 })
    return resp.result
  }
}
