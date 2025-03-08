export interface Asset {
  name: string;
  value: number;
}

export interface HolderInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  occupation: string;
  employerName: string;
  annualIncome: number;
  dateOfBirth: string;
  nationality: string;
  languages: string[];
  additionalDocuments?: string[];
  assets: Asset[];
}

export interface Credential {
  id: string;
  holder: string;
  holderInfo: HolderInfo;
  issuer: string;
  issuanceDate: string;
  status: 'PENDING' | 'INFO_REQUESTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  requestedInfo?: string[];
  holderResponse?: string;
  fields: {
    kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
    dateOfBirth: string;
    nationality: string;
    languages: string[];
    netWorth: number;
  };
}

export type UserRole = 'HOLDER' | 'ISSUER';

export type DisclosureOption = 'all' | 'kyc-only' | 'age-verification' | 'wealth-threshold';

export interface DisclosureResult {
  id: string;
  holder: string;
  disclosedFields: Partial<Credential['fields']>;
  proofs?: {
    isOver18?: boolean;
    meetsWealthThreshold?: boolean;
    wealthThresholdValue?: number;
  };
}