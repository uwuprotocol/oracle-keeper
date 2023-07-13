require("dotenv").config();
const bn = require("bn.js");
const txn = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");

const blockchainApi = process.env.BLOCKCHAIN_API;
const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractName = process.env.CONTRACT_NAME;
const functionName = process.env.FUNCTION_NAME;
const feeRate = process.env.FEE_RATE;

if (!blockchainApi || !publicKey || !privateKey || !contractAddress || !contractName || !functionName || !feeRate) {
  console.error(`[Oracle Keeper - ${Date.now()}] Missing one or more of the required environment variables.`);
  process.exit(1);
};

const fetchJSON = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (err) {
    console.error(`[Oracle Keeper - ${Date.now()}] An error occurred while fetching data from ${url}.`);
    throw new Error(`ERROR: ${err}`);
  };
};

const fetchNonce = async () => {
  const url = `${blockchainApi}/extended/v1/address/${publicKey}/nonces`;
  const response = await fetchJSON(url);

  const nonce = response?.possible_next_nonce;

  if(nonce === undefined) {
    console.error(`[Oracle Keeper - ${Date.now()}] An error occurred while fetching the possible next nonce for ${publicKey}.`);
    throw new Error(`ERROR: Missing possible_next_nonce in response.`);
  };

  return nonce;
};

const callBroadcastTransaction = async () => {
  const network = new StacksMainnet();

  try {
    let nonce = await fetchNonce();

    const options = {
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: functionName,
      functionArgs: [],
      senderKey: privateKey,
      nonce: new bn(nonce),
      fee: new bn(feeRate, 10),
      postConditionMode: 2,
      network
    };

    const transaction = await txn.makeContractCall(options);
    const result = await txn.broadcastTransaction(transaction, network);

    console.log(`[Oracle Keeper - ${Date.now()}] Successfully broadcasted a transaction with hash ${transaction.txid()}.`);
  } catch (err) {
    console.error(`[Oracle Keeper - ${Date.now()}] An error occurred while broadcasting a transaction.`);
    throw new Error(`ERROR: ${err}`);
  };
};

callBroadcastTransaction();
