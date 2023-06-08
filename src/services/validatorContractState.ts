import {Inject, Service} from "typedi";
import {Contract, ethers, Signer, Wallet} from "ethers";
import fs, {readFileSync} from "fs";
import path from "path";
import {JsonRpcProvider} from "@ethersproject/providers/src.ts/json-rpc-provider";
import EnvLoader from "../utilz/envLoader";
import {Logger} from "winston";
import StrUtil from "../utilz/strUtil";

import log from '../loaders/logger'

/*
Validator contract abstraction.
All blockchain goes here
 */
@Service()
export class ValidatorContractState {
  nodeId: string;
  wallet: Wallet;

  private log: Logger;

  private contractFactory: ContractClientFactory;
  public contractCli: ValidatorCtClient;

  public async postConstruct() {
    this.log = log;
    log.info("ValidatorContractState.postConstruct()");
    this.contractFactory = new ContractClientFactory();
    this.contractCli = await this.contractFactory.buildRWClient(log);
    await this.contractCli.connect();
    this.log.info("loaded %o ", this.contractCli.vNodesMap);
    this.wallet = this.contractFactory.nodeWallet;
    this.nodeId = this.wallet.address;
    if (!this.wallet) throw new Error("wallet is not loaded");
    if (this.contractCli.vNodesMap == null) throw new Error("Nodes are not initialized");
  }

  public isActiveValidator(nodeId: string): boolean {
    let vi = this.contractCli.vNodesMap.get(nodeId);
    return vi != null;
  }

  public getAllValidatorsMap(): Map<string, NodeInfo> {
    return this.contractCli.vNodesMap;
  }

  public getAllValidators(): NodeInfo[] {
    return Array.from(this.getAllValidatorsMap().values());
  }
}


class ContractClientFactory {
  private validatorCtAddr: string;
  private provider: JsonRpcProvider;
  private abi: string;
  private pushTokenAddr: string;
  private validatorRpcEndpoint: string;
  private validatorRpcNetwork: number;
  private configDir: string;
  nodeWallet: Wallet;
  // private nodeWallet: Signer;
  private validatorPrivateKeyFile: string;
  private validatorPrivateKeyPass: string;
  private nodeAddress: string;

  constructor() {
    this.validatorCtAddr = EnvLoader.getPropertyOrFail("VALIDATOR_CONTRACT_ADDRESS");
    this.pushTokenAddr = EnvLoader.getPropertyOrFail("VALIDATOR_PUSH_TOKEN_ADDRESS");
    this.validatorRpcEndpoint = EnvLoader.getPropertyOrFail("VALIDATOR_RPC_ENDPOINT");
    this.validatorRpcNetwork = Number.parseInt(EnvLoader.getPropertyOrFail("VALIDATOR_RPC_NETWORK"));
    this.provider = new ethers.providers.JsonRpcProvider(this.validatorRpcEndpoint, this.validatorRpcNetwork);
    this.configDir = EnvLoader.getPropertyOrFail("CONFIG_DIR");
    this.abi = ContractClientFactory.loadValidatorContractAbi(this.configDir, "ValidatorV1.json");
  }

  private static loadValidatorContractAbi(configDir: string, fileNameInConfigDir: string): string {
    const fileAbsolute = path.resolve(configDir, `./${fileNameInConfigDir}`);
    const file = fs.readFileSync(fileAbsolute, "utf8")
    const json = JSON.parse(file)
    const abi = json.abi
    console.log(`abi size:`, abi.length)
    return abi
  }

  // creates a client which can only read blockchain state
  public async buildROClient(log: Logger): Promise<ValidatorCtClient> {
    const contract = new ethers.Contract(this.validatorCtAddr, this.abi, this.provider);
    return new ValidatorCtClient(contract, log);
  }

  // creates a client, using an encrypted private key from disk, so that we could write to the blockchain
  public async buildRWClient(log: Logger): Promise<ValidatorCtClient> {
    this.validatorPrivateKeyFile = EnvLoader.getPropertyOrFail("VALIDATOR_PRIVATE_KEY_FILE");
    this.validatorPrivateKeyPass = EnvLoader.getPropertyOrFail("VALIDATOR_PRIVATE_KEY_PASS");

    let jsonFile = readFileSync(this.configDir + "/" + this.validatorPrivateKeyFile, 'utf-8');
    this.nodeWallet = await Wallet.fromEncryptedJson(jsonFile, this.validatorPrivateKeyPass);
    this.nodeAddress = await this.nodeWallet.getAddress();

    const signer = this.nodeWallet.connect(this.provider)
    const contract = new ethers.Contract(this.validatorCtAddr, this.abi, signer);
    return new ValidatorCtClient(contract, log);
  }
}


// all Validator contract interactions are wrapped into this class
export class ValidatorCtClient {
  contract: Contract;
  private log: Logger;

  // contract state
  vNodesMap: Map<string, NodeInfo> = new Map<string, NodeInfo>();
  dNodesMap: Map<string, NodeInfo> = new Map<string, NodeInfo>();
  sNodesMap: Map<string, NodeInfo> = new Map<string, NodeInfo>();
  public attestersRequired: number;
  public nodeRandomMinCount: number;
  public nodeRandomPingCount: number;


  constructor(contract: ethers.Contract, log: Logger) {
    this.contract = contract;
    this.log = log;
  }

  async loadConstants() {
    {
      this.attestersRequired = await this.contract.attestersRequired();
      log.info(`attestersRequired=${this.attestersRequired}`);
      if (this.attestersRequired == null) {
        throw new Error('attestersRequired is undefined');
      }
      this.contract.on("AttestersRequiredUpdated",
        (value: number) => {
          this.attestersRequired = value;
          log.info(`attestersRequired=${this.attestersRequired}`);
        });
    }

    {
      this.nodeRandomMinCount = await this.contract.nodeRandomMinCount();
      log.info(`nodeRandomMinCount=${this.nodeRandomMinCount}`);
      if (this.nodeRandomMinCount == null) {
        throw new Error('nodeRandomMinCount is undefined');
      }
      this.contract.on("NodeRandomMinCountUpdated",
        (value: number) => {
          this.nodeRandomMinCount = value;
          log.info(`nodeRandomMinCount=${this.nodeRandomMinCount}`);
        });
    }

    {
      this.nodeRandomPingCount = await this.contract.nodeRandomPingCount();
      log.info(`nodeRandomPingCount=${this.nodeRandomPingCount}`);
      if (this.nodeRandomPingCount == null) {
        throw new Error('nodeRandomPingCount is undefined');
      }
      this.contract.on("NodeRandomPingCountUpdated",
        (value: number) => {
          this.nodeRandomPingCount = value;
          log.info(`nodeRandomPingCount=${this.nodeRandomPingCount}`);
        });
    }
  }

  async connect() {
    await this.loadConstants();
    let result = this.loadNodesFromEnv();
    if (result != null) {
      // we have a debug variable set; no need to do blockchain
      this.vNodesMap = result;
      return;
    }
    result = new Map<string, NodeInfo>();
    const nodeAddresses = await this.contract.getNodes();
    for (const nodeAddress of nodeAddresses) {
      let nodeInfo = await this.contract.getNodeInfo(nodeAddress);
      const vi = new NodeInfo(nodeInfo.nodeWallet, nodeInfo.nodeApiBaseUrl);
      result.set(nodeInfo.nodeWallet, vi);
    }
    console.log(result);
    this.vNodesMap = new Map<string, NodeInfo>();

    this.contract.on("NodeAdded",
      (ownerWallet: string, nodeWallet: string, nodeType: number, nodeTokens: number,
       nodeApiBaseUrl: string) => {
        console.log("NodeAdded", arguments)
        console.log("NodeAdded", ownerWallet, nodeWallet, nodeType, nodeTokens, nodeApiBaseUrl);
        this.vNodesMap.set(nodeWallet, new NodeInfo(nodeWallet, nodeApiBaseUrl));
        console.log("ValidatorMap:", this.vNodesMap);
      });

    this.contract.on("NodeStatusChanged",
      (nodeWallet: string, nodeStatus: number, nodeTokens: number) => {
        console.log("NodeStatusChanged", arguments)
        console.log("NodeStatusChanged", nodeWallet, nodeStatus, nodeTokens);
        if (nodeStatus == NodeStatus.BannedAndUnstaked ||
          nodeStatus == NodeStatus.Unstaked) {
          this.vNodesMap.delete(nodeWallet);
        }
      });
  }

  public loadNodesFromEnv(): Map<string, NodeInfo> | null {
    let testValidatorsEnv = process.env.VALIDATOR_CONTRACT_TEST_VALIDATORS;
    if (testValidatorsEnv) {
      // test mode
      let testValidators = <{ validators: NodeInfo[] }>JSON.parse(testValidatorsEnv);
      let result = new Map<string, NodeInfo>();
      for (const vi of testValidators.validators) {
        vi.nodeId = StrUtil.normalizeEthAddress(vi.nodeId);
        result.set(vi.nodeId, vi);
      }
      return result;
    } else {
      return null;
    }
  }
}

// from smart contract
enum NodeStatus {
  OK,
  Reported,
  Slashed,
  BannedAndUnstaked,
  Unstaked
}

export class NodeInfo {
  nodeId: string;
  url: string;


  constructor(nodeId: string, url: string) {
    this.nodeId = nodeId;
    this.url = url;
  }
}
