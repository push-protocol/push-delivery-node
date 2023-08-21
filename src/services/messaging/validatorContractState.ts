import { Service } from 'typedi'
import { Contract, ethers, Wallet } from 'ethers'
import StrUtil from '../../utilz/strUtil'

import fs, { readFileSync } from 'fs'
import path from 'path'
import { JsonRpcProvider } from '@ethersproject/providers/src.ts/json-rpc-provider'
import { EnvLoader } from '../../utilz/envLoader'
import { Logger } from 'winston'
import { WinstonUtil } from '../../utilz/winstonUtil'

/*
Validator contract abstraction.
All blockchain goes here
 */
@Service()
export class ValidatorContractState {
  nodeId: string
  wallet: Wallet

  public log: Logger = WinstonUtil.newLog(ValidatorContractState)

  private contractFactory: ContractClientFactory
  public contractCli: ValidatorCtClient

  public async postConstruct() {
    this.log.info('ValidatorContractState.postConstruct()')
    this.contractFactory = new ContractClientFactory()
    this.contractCli = await this.contractFactory.buildRWClient(this.log)
    await this.contractCli.connect()
    this.log.info('loaded %o ', this.contractCli.nodeMap)
    this.wallet = this.contractFactory.nodeWallet
    this.nodeId = this.wallet.address
    if (!this.wallet) throw new Error('wallet is not loaded')
    if (this.contractCli.nodeMap == null) throw new Error('Nodes are not initialized')
  }

  public isActiveValidator(nodeId: string): boolean {
    const vi = this.contractCli.nodeMap.get(nodeId)
    return vi != null
  }

  public getAllNodesMap(): Map<string, NodeInfo> {
    return this.contractCli.nodeMap
  }

  public getActiveValidatorsExceptSelf(): NodeInfo[] {
    const allNodes = Array.from(this.getAllNodesMap().values())
    const onlyGoodValidators = allNodes.filter(
      (ni) =>
        ni.nodeType == NodeType.VNode &&
        ValidatorContractState.isEnabled(ni) &&
        this.nodeId !== ni.nodeId
    )
    return onlyGoodValidators
  }

  public getActiveValidators(): NodeInfo[] {
    const allNodes = Array.from(this.getAllNodesMap().values())
    const onlyGoodValidators = allNodes.filter(
      (ni) => ni.nodeType == NodeType.VNode && ValidatorContractState.isEnabled(ni)
    )
    return onlyGoodValidators
  }

  public getAllValidatorsExceptSelf(): NodeInfo[] {
    const allNodes = Array.from(this.getAllNodesMap().values())
    const onlyGoodValidators = allNodes.filter(
      (ni) =>
        ni.nodeType == NodeType.VNode &&
        ValidatorContractState.isEnabled(ni) &&
        this.nodeId !== ni.nodeId
    )
    return onlyGoodValidators
  }

  public static isEnabled(ni: NodeInfo) {
    return (
      ni.nodeStatus == NodeStatus.OK ||
      ni.nodeStatus == NodeStatus.Reported ||
      ni.nodeStatus == NodeStatus.Slashed
    )
  }
}

class ContractClientFactory {
  private validatorCtAddr: string
  private provider: JsonRpcProvider
  private abi: string
  private pushTokenAddr: string
  private validatorRpcEndpoint: string
  private validatorRpcNetwork: number
  private configDir: string
  nodeWallet: Wallet
  // private nodeWallet: Signer;
  private validatorPrivateKeyFile: string
  private validatorPrivateKeyPass: string
  private nodeAddress: string

  constructor() {
    this.validatorCtAddr = EnvLoader.getPropertyOrFail('VALIDATOR_CONTRACT_ADDRESS')
    this.pushTokenAddr = EnvLoader.getPropertyOrFail('VALIDATOR_PUSH_TOKEN_ADDRESS')
    this.validatorRpcEndpoint = EnvLoader.getPropertyOrFail('VALIDATOR_RPC_ENDPOINT')
    this.validatorRpcNetwork = Number.parseInt(EnvLoader.getPropertyOrFail('VALIDATOR_RPC_NETWORK'))
    this.provider = new ethers.providers.JsonRpcProvider(
      this.validatorRpcEndpoint,
      this.validatorRpcNetwork
    )
    this.configDir = EnvLoader.getPropertyOrFail('CONFIG_DIR')
    this.abi = ContractClientFactory.loadValidatorContractAbi(this.configDir, 'ValidatorV1.json')
  }

  private static loadValidatorContractAbi(configDir: string, fileNameInConfigDir: string): string {
    const fileAbsolute = path.resolve(configDir, `./${fileNameInConfigDir}`)
    const file = fs.readFileSync(fileAbsolute, 'utf8')
    const json = JSON.parse(file)
    const abi = json.abi
    console.log(`abi size:`, abi.length)
    return abi
  }

  // creates a client which can only read blockchain state
  public async buildROClient(log: Logger): Promise<ValidatorCtClient> {
    const contract = new ethers.Contract(this.validatorCtAddr, this.abi, this.provider)
    return new ValidatorCtClient(contract, log)
  }

  // creates a client, using an encrypted private key from disk, so that we could write to the blockchain
  public async buildRWClient(log: Logger): Promise<ValidatorCtClient> {
    this.validatorPrivateKeyFile = EnvLoader.getPropertyOrFail('VALIDATOR_PRIVATE_KEY_FILE')
    this.validatorPrivateKeyPass = EnvLoader.getPropertyOrFail('VALIDATOR_PRIVATE_KEY_PASS')

    const jsonFile = readFileSync(this.configDir + '/' + this.validatorPrivateKeyFile, 'utf-8')
    this.nodeWallet = await Wallet.fromEncryptedJson(jsonFile, this.validatorPrivateKeyPass)
    this.nodeAddress = await this.nodeWallet.getAddress()

    const signer = this.nodeWallet.connect(this.provider)
    const contract = new ethers.Contract(this.validatorCtAddr, this.abi, signer)
    return new ValidatorCtClient(contract, log)
  }
}

// all Validator contract interactions are wrapped into this class
export class ValidatorCtClient {
  contract: Contract
  private log: Logger

  // contract state
  nodeMap: Map<string, NodeInfo> = new Map<string, NodeInfo>()
  public attestersRequired: number
  public nodeRandomMinCount: number
  public nodeRandomPingCount: number

  constructor(contract: ethers.Contract, log: Logger) {
    this.contract = contract
    this.log = log
  }

  private async loadConstants() {
    {
      this.attestersRequired = await this.contract.attestersRequired()
      this.log.info(`attestersRequired=${this.attestersRequired}`)
      if (this.attestersRequired == null) {
        throw new Error('attestersRequired is undefined')
      }
      this.contract.on('AttestersRequiredUpdated', (value: number) => {
        this.attestersRequired = value
        this.log.info(`attestersRequired=${this.attestersRequired}`)
      })
    }

    {
      this.nodeRandomMinCount = await this.contract.nodeRandomMinCount()
      this.log.info(`nodeRandomMinCount=${this.nodeRandomMinCount}`)
      if (this.nodeRandomMinCount == null) {
        throw new Error('nodeRandomMinCount is undefined')
      }
      this.contract.on('NodeRandomMinCountUpdated', (value: number) => {
        this.nodeRandomMinCount = value
        this.log.info(`nodeRandomMinCount=${this.nodeRandomMinCount}`)
      })
    }

    {
      this.nodeRandomPingCount = await this.contract.nodeRandomPingCount()
      this.log.info(`nodeRandomPingCount=${this.nodeRandomPingCount}`)
      if (this.nodeRandomPingCount == null) {
        throw new Error('nodeRandomPingCount is undefined')
      }
      this.contract.on('NodeRandomPingCountUpdated', (value: number) => {
        this.nodeRandomPingCount = value
        this.log.info(`nodeRandomPingCount=${this.nodeRandomPingCount}`)
      })
    }
  }

  async connect() {
    await this.loadConstants()
    const result = this.loadNodesFromEnv()
    if (result != null) {
      // we have a debug variable set; no need to do blockchain
      this.nodeMap = result
      return
    }
    const nodeAddresses = await this.contract.getNodes()
    for (const nodeAddress of nodeAddresses) {
      const ctObj = await this.contract.getNodeInfo(nodeAddress)
      this.nodeMap.set(
        ctObj.nodeWallet,
        new NodeInfo(ctObj.nodeWallet, ctObj.nodeApiBaseUrl, ctObj.nodeType, NodeStatus.OK)
      )
    }
    this.log.info('contract nodes loaded %o', this.nodeMap)

    this.contract.on(
      'NodeAdded',
      (
        ownerWallet: string,
        nodeWallet: string,
        nodeType: number,
        nodeTokens: number,
        nodeApiBaseUrl: string
      ) => {
        this.log.info('NodeAdded %o', arguments)
        this.log.info(
          'NodeAdded %s %s %s %s %s',
          ownerWallet,
          nodeWallet,
          nodeType,
          nodeTokens,
          nodeApiBaseUrl
        )
        this.nodeMap.set(
          nodeWallet,
          new NodeInfo(nodeWallet, nodeApiBaseUrl, nodeType, NodeStatus.OK)
        )
        this.log.info('ValidatorMap: %o', this.nodeMap)
      }
    )

    this.contract.on(
      'NodeStatusChanged',
      (nodeWallet: string, nodeStatus: number, nodeTokens: number) => {
        this.log.info('NodeStatusChanged', arguments)
        this.log.info('NodeStatusChanged', nodeWallet, nodeStatus, nodeTokens)
        const ni = this.nodeMap.get(nodeWallet)
        if (ni == null) {
          this.log.error(`unknown node ${nodeWallet}`)
          return
        }
        ni.nodeStatus = nodeStatus
      }
    )
  }

  private loadNodesFromEnv(): Map<string, NodeInfo> | null {
    const testValidatorsEnv = process.env.VALIDATOR_CONTRACT_TEST_VALIDATORS
    if (testValidatorsEnv) {
      // test mode
      const testValidators = <{ validators: NodeInfo[] }>JSON.parse(testValidatorsEnv)
      const result = new Map<string, NodeInfo>()
      for (const vi of testValidators.validators) {
        vi.nodeId = StrUtil.normalizeEthAddress(vi.nodeId)
        result.set(vi.nodeId, vi)
      }
      return result
    } else {
      return null
    }
  }
}

// from smart contract
export enum NodeStatus {
  OK,
  Reported,
  Slashed,
  BannedAndUnstaked,
  Unstaked
}

export class NodeInfo {
  nodeId: string
  url: string
  nodeType: NodeType
  nodeStatus: NodeStatus

  constructor(nodeId: string, url: string, nodeType: NodeType, nodeStatus: NodeStatus) {
    this.nodeId = nodeId
    this.url = url
    this.nodeType = nodeType
    this.nodeStatus = nodeStatus
  }
}

export enum NodeType {
  VNode = 0, // validator 0
  SNode = 1, // storage 1
  DNode = 2 // delivery 2
}
