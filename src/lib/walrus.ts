const PUBLISHER = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL;
const AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;

export async function uploadToWalrus(file: File, epochs = 50): Promise<string> {
  if (!PUBLISHER) throw new Error("NEXT_PUBLIC_WALRUS_PUBLISHER_URL is not set");
  const buffer = await file.arrayBuffer();
  try {
    // Walrus testnet publisher endpoint: PUT /v1/blobs
    // epochs parameter tells Walrus how many epochs to retain the blob
    const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      console.error("Walrus upload response not OK:", response.status, body);
      throw new Error(`Walrus upload failed (${response.status}): ${body}`);
    }
    const data = await response.json();
    console.log("Walrus upload raw response:", data);
    const blobId =
      data?.newlyCreated?.blobObject?.blobId ??
      data?.alreadyCertified?.blobId ??
      null;
    if (!blobId) {
      throw new Error(`Walrus returned unexpected response: ${JSON.stringify(data)}`);
    }
    return blobId as string;
  } catch (err) {
    console.error("Walrus upload exception:", err);
    throw err;
  }
}

export async function fetchFromWalrus(blobId: string): Promise<Blob> {
  if (!AGGREGATOR) throw new Error("NEXT_PUBLIC_WALRUS_AGGREGATOR_URL is not set");
  // Walrus testnet aggregator endpoint: GET /v1/blobs/:blobId
  const response = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
  if (!response.ok) {
    throw new Error(`Walrus fetch failed (${response.status}): ${response.statusText}`);
  }
  return response.blob();
}

export function getWalrusScanUrl(blobId: string): string {
  return `https://walruscan.com/testnet/blob/${blobId}`;
}

export function getWalrusAggregatorUrl(blobId: string): string {
  if (!AGGREGATOR) return "";
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}
