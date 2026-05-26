const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/uazQprybFPHVubCQDFS6D";
const colAddress = "0xD6f0c6E4bF6b5E25159824A56a78b845eb66BA36";

const ERC721_ABI = [
  { name: "tokenURI", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "string" }] }
];

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

async function run() {
  try {
    const tokenURI = await publicClient.readContract({
      address: colAddress,
      abi: ERC721_ABI,
      functionName: "tokenURI",
      args: [1n],
    });
    console.log("Token URI:", tokenURI);

    // Resolve IPFS URL
    let url = tokenURI;
    if (url.startsWith("ipfs://")) {
      url = "https://ipfs.io/ipfs/" + url.slice(7);
    }
    console.log("Resolved URL:", url);

    console.log("Fetching metadata...");
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      console.log("Metadata data:", data);
    } else {
      console.log("Fetch failed status:", res.status);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
