export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";

// Deliberately no hardcoded fallback — empty string means "not deployed yet"
export const PROXY_PACKAGE_ID = process.env.NEXT_PUBLIC_PROXY_PACKAGE_ID || "0xc21e43a3672638aa30311002b34551b629ab98af2d8924dcfbbcfd483e1c5b10";

export const DELEGATION_OBJECT_TYPE = PROXY_PACKAGE_ID
  ? `${PROXY_PACKAGE_ID}::delegation::DelegationObject`
  : "";

export const WALRUS_PUBLISHER_URL =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL ||
  "https://publisher.walrus-testnet.walrus.space";

export const WALRUS_AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ||
  "https://aggregator.walrus-testnet.walrus.space";

/** Returns true when the Move contract package has been deployed */
export const isContractDeployed = () => !!PROXY_PACKAGE_ID;

export const SUI_CLOCK_OBJECT_ID = '0x6';
