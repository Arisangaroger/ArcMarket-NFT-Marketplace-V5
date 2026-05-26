const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/uazQprybFPHVubCQDFS6D";
const MARKETPLACE_ADDRESS = "0x15222DD79009De01F847250E2B1e351D66ad773a";
const COLLECTION_ADDRESSES = [
  "0xD6f0c6E4bF6b5E25159824A56a78b845eb66BA36",
  "0x60c2A5b0B2344EF4f4BCc254bC12461a9c2Bec18",
  "0x6e0741f87CC16C0740C1F8232eB7B149C6E7AD7F"
];

const ERC721_ABI = [
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "tokenURI", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "string" }] }
];

const MARKETPLACE_ABI = [
  {
    name: "listings",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "isActive", type: "bool" }
    ]
  }
];

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

async function fetchState() {
  console.log("Starting fetchState execution...");
  try {
    const currentBlock = await publicClient.getBlockNumber();
    console.log("Current block:", currentBlock.toString());
    const fromBlock = currentBlock > 500000n ? currentBlock - 500000n : 0n;
    console.log("Attempting event query fromBlock:", fromBlock.toString());

    // Actually, we use publicClient.getContractEvents in viem, but in standard viem, it uses eth_getLogs. Let's see if this fails.
    const [listedLogs, boughtLogs, cancelledLogs, updatedLogs] = await Promise.all([
      publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemListed", fromBlock }),
      publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemBought", fromBlock }),
      publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemCancelled", fromBlock }),
      publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemUpdated", fromBlock }),
    ]);

    console.log(`Success querying events: ${listedLogs.length} listed, ${boughtLogs.length} bought`);
  } catch (e) {
    console.warn("Event fetching failed (possibly due to Alchemy RPC block range limits). Falling back to direct collection scanning...", e.message || e);
    try {
      const scannedListings = [];

      for (const colAddress of COLLECTION_ADDRESSES) {
        try {
          console.log(`Scanning collection: ${colAddress}`);
          const [name, symbol, totalSupplyRaw] = await Promise.all([
            publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "name" }).catch(() => "Unknown"),
            publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "symbol" }).catch(() => ""),
            publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "totalSupply" }).catch(() => 0n),
          ]);

          const totalSupply = Number(totalSupplyRaw);
          const maxToScan = totalSupply > 0 ? totalSupply : 20;
          console.log(`Collection ${name}: maxToScan = ${maxToScan}`);

          const promises = [];
          for (let i = 1; i <= maxToScan; i++) {
            promises.push(
              publicClient.readContract({
                address: MARKETPLACE_ADDRESS,
                abi: MARKETPLACE_ABI,
                functionName: "listings",
                args: [colAddress, BigInt(i)],
              }).then(res => ({ tokenId: i, res }))
                .catch(() => null)
            );
          }

          const results = await Promise.all(promises);
          for (const item of results) {
            if (item && item.res && item.res[2]) { // isActive
              const [seller, price] = item.res;
              scannedListings.push({
                nftAddress: colAddress,
                tokenId: item.tokenId.toString(),
                seller,
                price,
                collectionName: name,
                collectionSymbol: symbol
              });
            }
          }
        } catch (colErr) {
          console.error(`Error scanning collection ${colAddress} in fallback:`, colErr);
        }
      }

      console.log(`Fallback scan found ${scannedListings.length} listings:`, scannedListings);
    } catch (fallbackErr) {
      console.error("Critical fallback scanning failure:", fallbackErr);
    }
  }
}

fetchState();
