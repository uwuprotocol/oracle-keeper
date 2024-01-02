require("dotenv").config();

const bn = require("bn.js");
const fetch = require("node-fetch");
const txn = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");

const rpcUrl = process.env.RPC_URL;
const signerPublicKey = process.env.SIGNER_PUBLIC_KEY;
const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
const sourceOracleContract = process.env.SOURCE_ORACLE_CONTRACT;
const uwuOracleContract = process.env.UWU_ORACLE_CONTRACT;
const txMinFeeRate = process.env.TX_MIN_FEE_RATE;
const txMaxFeeRate = process.env.TX_MAX_FEE_RATE;
const txRBFIncrement = process.env.TX_RBF_INCREMENT;

const fetchJSON = async (url) => {
  try {
    const response = await fetch(url);

    return await response.json();
  } catch (err) {
    throw new Error(`Failed to fetch data from URL '${url}': ${err.message}`);
  };
};

const fetchNonce = async (address, type = "next") => {
  try {
    const response = await fetchJSON(`${rpcUrl}/extended/v1/address/${address}/nonces`);
    const nonce = (type === "next") ? response.possible_next_nonce : response.last_executed_tx_nonce;

    return nonce;
  } catch (err) {
    throw new Error(`Failed to fetch nonce for address '${address}': ${err.message}`);
  };
};

const fetchTokenBalance = async (token, address, type = "balance", unanchored = false) => {
  try {
    const response = await fetchJSON(`${rpcUrl}/extended/v1/address/${address}/balances?unanchored=${unanchored}`);
    const balance = token === "stx" ? response.stx[type] : response.fungible_tokens[token][type];

    return balance;
  } catch (err) {
    throw new Error(`Failed to fetch a token balance for address '${address}': ${err.message}`);
  };
};

const fetchTimestamp = async (address) => {
  try {
    const response = await fetchJSON(`${rpcUrl}/extended/v1/address/${address}/transactions?limit=1`);
    const timestamp = response.results[0].burn_block_time;

    return timestamp;
  } catch (err) {
    throw new Error(`Failed to fetch the timestamp of a recent transaction for address '${address}': ${err.message}`);
  };
};

const fetchLatestPendingTransaction = async (address) => {
  try {
    const response = await fetchJSON(`${rpcUrl}/extended/v1/address/${address}/mempool?limit=1`);
    
    if (!response.results || response.results.length === 0) {
      return null;
    };

    return response.results[0];
  } catch (err) {
    throw new Error(`Failed to fetch the latest pending transaction for address '${address}': ${err.message}`);
  };
};

const fetchFeeRate = async (minFeeRate, maxFeeRate) => {
  try {
    const response = await fetchJSON(`${rpcUrl}/extended/v1/tx/mempool/stats`);
    const feeAverages = response.tx_simple_fee_averages.token_transfer;
    const txCount = Object.values(response.tx_type_counts).reduce((acc, count) => acc + count, 0);

    let percentile;

    if (txCount < 2500) {
      percentile = "p25";
    } else if (txCount >= 2500 && txCount < 5000) {
      percentile = "p50";
    } else {
      percentile = "p75";
    };

    const selectedPercentileFee = feeAverages[percentile];

    let optimalFeeRate = Math.max(minFeeRate, Math.min(selectedPercentileFee, maxFeeRate));

    optimalFeeRate = Math.floor(optimalFeeRate);

    return optimalFeeRate;
  } catch (err) {
    throw new Error(`Failed to calculate the optimal fee rate: ${err.message}`);
  };
};

const fetchSTXBalance = (address, type = "balance") => fetchTokenBalance("stx", address, type);

const runScript = async () => {
  const network = new StacksMainnet();
  const oneHourAgo = new bn(Math.floor(Date.now() / 1000) - 3600);

  try {
    if (!rpcUrl || !signerPublicKey ||
      !signerPrivateKey || !sourceOracleContract ||
      !uwuOracleContract || !txMinFeeRate ||
      !txMaxFeeRate || !txRBFIncrement) {
      throw new Error("One or more of the required environment variables are missing");
    };

    const timestampSourceOracle = new bn(await fetchTimestamp(sourceOracleContract));
    const timestampUWUOracle = new bn(await fetchTimestamp(uwuOracleContract));

    if (timestampSourceOracle.lte(timestampUWUOracle)) {
      throw new Error("The Oracle Proxy is already synchronized with the most recent price data");
    };

    if (timestampUWUOracle.gt(oneHourAgo)) {
      throw new Error("The Oracle Proxy was updated less than an hour ago");
    };

    const latestPendingTx = await fetchLatestPendingTransaction(signerPublicKey);
    const stxBalance = new bn(await fetchSTXBalance(signerPublicKey));

    let finalNonce = new bn(await fetchNonce(signerPublicKey, "next"));
    let lastNonce = new bn(await fetchNonce(signerPublicKey, "last"));
    let feeRate = new bn(await fetchFeeRate(txMinFeeRate, txMaxFeeRate));
    let txType = "New";

    if (latestPendingTx &&
      latestPendingTx.sender_address === signerPublicKey &&
      latestPendingTx.tx_type === "contract_call" &&
      latestPendingTx.contract_call.contract_id === uwuOracleContract &&
      latestPendingTx.contract_call.function_name === "send-to-proxy") {
      finalNonce = new bn(latestPendingTx.nonce);
      feeRate = new bn(latestPendingTx.fee_rate).add(new bn(txRBFIncrement));
      txType = "Replacement";
    };

    if (finalNonce.eq(lastNonce)) {
      finalNonce.iadd(new bn(1));
      txType = "New";
    };

    if (stxBalance.lt(feeRate)) {
      throw new Error("The signer does not have enough STX to pay for transaction fees");
    };

    const options = {
      contractAddress: uwuOracleContract.split(".")[0],
      contractName: uwuOracleContract.split(".")[1],
      functionName: "send-to-proxy",
      functionArgs: [],
      senderKey: signerPrivateKey,
      nonce: finalNonce,
      fee: feeRate,
      postConditionMode: 2,
      network
    };

    const transaction = await txn.makeContractCall(options);

    await txn.broadcastTransaction(transaction, network);

    console.log(`Oracle Keeper (${Date.now()}): Successfully broadcasted a transaction`);
    console.log(`[Transaction] Oracle Keeper (${Date.now()}): [ID: ${transaction.txid()}]`);
    console.log(`[Transaction] Oracle Keeper (${Date.now()}): [Type: ${txType}]`);
    console.log(`[Transaction] Oracle Keeper (${Date.now()}): [Nonce: ${finalNonce.toString()}]`);
    console.log(`[Transaction] Oracle Keeper (${Date.now()}): [Fee Rate: ${feeRate.toString()}]`);
  } catch (err) {
    console.error(`[Operation Error] Oracle Keeper (${Date.now()}): ${err.message}`);
  };
};

runScript();
