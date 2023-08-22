// abstract item, can be anything
export interface QItem {
  // a queue index, 0-based number, always grows
  // filled only when Item is fetched by QueueClient from another remote QueueServer
  id?: number
  // some unique data hash (or ID); // todo check that we use that correctly
  object_hash?: string
  // a json payload with data
  object: DCmd
}

// abstract command, only for type checks
export interface DCmd {}

export interface Consumer<T> {
  accept(item: T): Promise<boolean>
}
