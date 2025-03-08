import { v4 as uuidv4 } from 'uuid';
import { Credential, DisclosureOption, DisclosureResult, HolderInfo } from '../types';

export const createCredential = (holderInfo: HolderInfo): Credential => {
  // Calculate net worth based on annual income and assets
  const totalAssetsValue = holderInfo.assets.reduce((sum, asset) => sum + asset.value, 0);
  const netWorth = holderInfo.annualIncome * 3 + totalAssetsValue; // Annual income * 3 plus total assets value

  return {
    id: uuidv4(),
    holder: holderInfo.fullName,
    holderInfo,
    issuer: 'Terminal3 Bank',
    issuanceDate: new Date().toISOString(),
    status: 'PENDING',
    fields: {
      kycStatus: 'PENDING',
      dateOfBirth: holderInfo.dateOfBirth || '1990-01-01', // Default date if not provided
      nationality: holderInfo.nationality || 'Not Specified',
      languages: holderInfo.languages || ['English'],
      netWorth: netWorth,
    },
  };
};

export const generateDisclosure = (
  credential: Credential,
  option: DisclosureOption,
  wealthThreshold: number = 1000000
): DisclosureResult => {
  const base = {
    id: credential.id,
    holder: credential.holder,
    disclosedFields: {},
    proofs: {},
  };

  switch (option) {
    case 'all':
      return {
        ...base,
        disclosedFields: credential.fields,
      };
    case 'kyc-only':
      return {
        ...base,
        disclosedFields: {
          kycStatus: credential.fields.kycStatus,
        },
      };
    case 'age-verification':
      const birthDate = new Date(credential.fields.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
      return {
        ...base,
        proofs: {
          isOver18: age >= 18,
        },
      };
    case 'wealth-threshold':
      return {
        ...base,
        disclosedFields: {
          netWorth: credential.fields.netWorth,
        },
        proofs: {
          meetsWealthThreshold: credential.fields.netWorth >= wealthThreshold,
          wealthThresholdValue: wealthThreshold,
        },
      };
    default:
      return base;
  }
};