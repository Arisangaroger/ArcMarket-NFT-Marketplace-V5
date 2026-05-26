const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/uazQprybFPHVubCQDFS6D";
const marketplaceAddress = "0x15222DD79009De01F847250E2B1e351D66ad773a";

const marketplaceAbi = [
  {
    type: "event",
    name: "ItemListed",
    inputs: [
      { name: "seller", type: "address", indexed: true },
      { name: "nftAddress", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "price", type: "uint256" },
    ],
  },
];

async function run() {
  console.log("Creating public client...");
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  try {
    const currentBlock = await publicClient.getBlockNumber();
    console.log("Current block:", currentBlock.toString());

    const range = 5000n; // 5000 blocks
    const fromBlock = currentBlock > range ? currentBlock - range : 0n;
    console.log(`Querying logs with range ${range} (from block ${fromBlock})...`);
    
    const start = Date.now();
    const logs = await publicClient.getContractEvents({
      address: marketplaceAddress,
      abi: marketplaceAbi,
      eventName: "ItemListed",
      fromBlock,
    });
    console.log(`Success! Found ${logs.length} ItemListed events in ${Date.now() - start}ms.`);
  } catch (err) {
    console.error("Error querying range:", err);
  }
}

run();
