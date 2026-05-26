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
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "isActive", type: "bool" }
    ]
  }
];

async function run() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  console.log("Scanning collections for listings...");
  const listings = [];

  for (const colAddress of COLLECTION_ADDRESSES) {
    try {
      console.log(`\nScanning collection ${colAddress}...`);
      const [name, symbol, totalSupplyRaw] = await Promise.all([
        publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "name" }).catch(() => "Unknown"),
        publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "symbol" }).catch(() => ""),
        publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "totalSupply" }).catch(() => 0n),
      ]);

      const totalSupply = Number(totalSupplyRaw);
      console.log(`Name: ${name}, Symbol: ${symbol}, Total Supply: ${totalSupply}`);

      const maxToScan = totalSupply > 0 ? totalSupply : 20;
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
          console.log(`FOUND ACTIVE LISTING! Token #${item.tokenId}: price = ${item.res[1].toString()}, seller = ${item.res[0]}`);
          listings.push({
            nftAddress: colAddress,
            tokenId: item.tokenId.toString(),
            seller: item.res[0],
            price: item.res[1],
            collectionName: name,
            collectionSymbol: symbol
          });
        }
      }
    } catch (e) {
      console.error(`Error scanning collection ${colAddress}:`, e);
    }
  }

  console.log(`\nTotal active listings found: ${listings.length}`);
}

run();
