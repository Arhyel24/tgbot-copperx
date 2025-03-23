export type Payee = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  nickName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  bankAccount: {
    country: "usa";
    bankName: string;
    bankAddress: string;
    type: "web3_wallet";
    bankAccountType: "savings";
    bankRoutingNumber: string;
    bankAccountNumber: string;
    bankBeneficiaryName: string;
    bankBeneficiaryAddress: string;
    swiftCode: string;
  };
  isGuest: boolean;
  hasBankAccount: boolean;
};

export type Wallet = {
  id: string;
  createdAt: string; 
  updatedAt: string; 
  organizationId: string;
  walletType: "web3_auth_copperx";
  network: string;
  walletAddress: string;
  isDefault: boolean;
};

export type CheckWalletBalance = {
  walletId: string;
  isDefault: boolean;
  network: string;
  balances: {
    decimals: number;
    balance: string;
    symbol: string;
    address: string;
  }[];
};

export interface Transaction {
  amount: number;
  currency: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface TransferData {
  currency: string;
  payeeId?: string;
  email?: string;
  walletAddress?: string;
  amount?: bigint | string;
  purposeCode?: string;
}

export interface QuoteRequest {
  sourceCountry: string;
  destinationCountry: string;
  amount: string;
  currency: string;
  destinationCurrency: string;
}

export interface QuoteResponse {
  arrivalTimeMessage: string;
  quotePayload: string;
  quoteSignature: string;
  error?: string;
}

export interface BulkTransferRequest {
  requestId: string;
  request: {
    walletAddress: string | null;
    email: string | null;
    payeeId: string;
    amount: string;
    purposeCode: string;
    currency: "USDC";
  };
}

export interface CustomerData {
  name: string;
  businessName: string;
  email: string;
  country: string;
}

export interface Transfer {
  amount: number;
  currency: string;
  status: string;
}

export interface TransferResponse {
  data: Transfer[];
}