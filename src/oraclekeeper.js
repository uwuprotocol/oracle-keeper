require("dotenv").config();

const bn = require("bn.js");
const txn = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");

const rpcUrl = process.env.RPC_URL;
const signerPublicKey = process.env.SIGNER_PUBLIC_KEY;
const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
const oracleContractName = process.env.ORACLE_CONTRACT_NAME;
const txFeeRate = process.env.TX_FEE_RATE;

if (!rpcUrl || !signerPublicKey || !signerPrivateKey || !oracleContractName || !txFeeRate) {
  console.error(`Oracle Keeper (${Date.now()}): Missing one or more of the required environment variables`);
  process.exit(1);
};

const fetchJSON = async (url) => {
  try {
    const response = await fetch(url);

    return await response.json();
  } catch (err) {
    console.error(`Oracle Keeper (${Date.now()}) An error occurred while fetching data from '${url}'`);

    throw new Error(`Operation Error (${Date.now()}): ${err}`);
  };
};

const fetchNonce = async () => {
  const url = `${rpcUrl}/extended/v1/address/${signerPublicKey}/nonces`;
  const response = await fetchJSON(url);
  const nonce = response?.possible_next_nonce;

  if (nonce === undefined) {
    console.error(`Oracle Keeper (${Date.now()}): An error occurred while fetching the possible next nonce for '${signerPublicKey}'`);
    
    throw new Error(`Operation Error (${Date.now()}): Missing 'possible_next_nonce' in response`);
  };

  return nonce;
};

const callBroadcastTransaction = async () => {
  const network = new StacksMainnet();

  try {
    let nonce = await fetchNonce();

    const options = {
      contractAddress: "SP2AKWJYC7BNY18W1XXKPGP0YVEK63QJG4793Z2D4",
      contractName: oracleContractName,
      functionName: "send-to-proxy",
      functionArgs: [],
      senderKey: signerPrivateKey,
      nonce: new bn(nonce),
      fee: new bn(txFeeRate, 10),
      postConditionMode: 2,
      network
    };

    const transaction = await txn.makeContractCall(options);
    const result = await txn.broadcastTransaction(transaction, network);

    console.log(`Oracle Keeper (${Date.now()}): Successfully broadcasted a transaction with hash '${transaction.txid()}'`);
  } catch (err) {
    console.error(`Oracle Keeper (${Date.now()}): An error occurred while broadcasting a transaction`);

    throw new Error(`Operation Error (${Date.now()}): ${err}`);
  };
};

callBroadcastTransaction();
