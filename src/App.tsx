import React, { useState, useEffect } from 'react';
import { Shield, User, Eye, BadgeCheck, X, AlertCircle, UserCog, Send, RefreshCw } from 'lucide-react';
import { Credential, DisclosureOption, DisclosureResult, UserRole, HolderInfo } from './types';
import { createCredential, generateDisclosure } from './utils/credentials';
import { saveHolderInfo } from './utils/db';
import t3Logo from './t3-logo.jpeg';

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('HOLDER');
  const [holderInfo, setHolderInfo] = useState<HolderInfo>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    occupation: '',
    employerName: '',
    annualIncome: 0,
    dateOfBirth: '',
    nationality: '',
    languages: ['English'],
    assets: [],
  });
  const [newAsset, setNewAsset] = useState({ name: '', value: 0 });
  const [credential, setCredential] = useState<Credential | null>(null);
  const [disclosure, setDisclosure] = useState<DisclosureResult | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HolderInfo, string>>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [wealthThreshold, setWealthThreshold] = useState<number>(1000000);
  const [holderResponse, setHolderResponse] = useState<string>('');
  const [hasIssuedCredential, setHasIssuedCredential] = useState<boolean>(false);

  // Load holder info from localStorage when component mounts
  useEffect(() => {
    const savedHolderInfo = localStorage.getItem('holderFormData');
    if (savedHolderInfo) {
      setHolderInfo(JSON.parse(savedHolderInfo));
    }
  }, []);

  // Save holder info to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('holderFormData', JSON.stringify(holderInfo));
  }, [holderInfo]);

  const validateForm = () => {
    const errors: Partial<Record<keyof HolderInfo, string>> = {};
    
    if (!holderInfo.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!holderInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holderInfo.email)) {
      errors.email = 'Invalid email format';
    }
    if (!holderInfo.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!holderInfo.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!holderInfo.occupation.trim()) {
      errors.occupation = 'Occupation is required';
    }
    if (!holderInfo.employerName.trim()) {
      errors.employerName = 'Employer name is required';
    }
    if (!holderInfo.annualIncome || holderInfo.annualIncome <= 0) {
      errors.annualIncome = 'Valid annual income is required';
    }
    if (!holderInfo.dateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!holderInfo.nationality.trim()) {
      errors.nationality = 'Nationality is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitHolderInfo = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await saveHolderInfo(holderInfo);
      const newCredential = createCredential(holderInfo);
      setCredential(newCredential);
      setDisclosure(null);
      
      setFormErrors({});
      setSuccessMessage('Information saved successfully!');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      resetForm();
    } catch (error) {
      console.error('Error saving holder information:', error);
      setSuccessMessage('Error saving information. Please try again.');
    }
  };

  const handleIssuerAction = (action: 'request' | 'approve' | 'reject') => {
    if (!credential) return;
    
    let updatedCredential = { ...credential };
    
    switch (action) {
      case 'request':
        updatedCredential.status = 'INFO_REQUESTED';
        updatedCredential.requestedInfo = [additionalInfo];
        break;
      case 'approve':
        updatedCredential.status = 'APPROVED';
        updatedCredential.fields.kycStatus = 'VERIFIED';
        break;
      case 'reject':
        updatedCredential.status = 'REJECTED';
        updatedCredential.fields.kycStatus = 'REJECTED';
        break;
    }
    
    setCredential(updatedCredential);
  };

  const handleHolderResponse = () => {
    if (!credential || !holderResponse.trim()) return;
    
    const updatedCredential = { ...credential };
    updatedCredential.status = 'REVIEWING';
    updatedCredential.holderResponse = holderResponse;
    setCredential(updatedCredential);
    setHolderResponse('');
  };

  const handleDisclose = (option: DisclosureOption) => {
    if (!credential) return;
    const result = generateDisclosure(credential, option, wealthThreshold);
    setDisclosure(result);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return <BadgeCheck className="text-green-500" />;
      case 'PENDING':
      case 'INFO_REQUESTED':
      case 'REVIEWING':
        return <AlertCircle className="text-yellow-500" />;
      case 'REJECTED':
        return <X className="text-red-500" />;
      default:
        return null;
    }
  };

  const resetForm = () => {
    const emptyForm = {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      occupation: '',
      employerName: '',
      annualIncome: 0,
      dateOfBirth: '',
      nationality: '',
      languages: ['English'],
      assets: [],
    };
    setHolderInfo(emptyForm);
    localStorage.removeItem('holderFormData'); // Clear localStorage when form is reset
  };

  const generateDID = () => {
    const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `did:ethr:${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
  };

  const handleIssueVC = () => {
    if (!credential || !disclosure || hasIssuedCredential) return;
    
    // Create a copy of the credential with updated status
    const issuedCredential = {
      ...credential,
      id: generateDID(),
      status: 'APPROVED' as const,
      fields: {
        ...credential.fields,
        kycStatus: 'VERIFIED' as const,
      },
      issuanceDate: new Date().toISOString(),
    };
    
    setCredential(issuedCredential);
    setSuccessMessage('Verifiable Credential issued successfully!');
    setHasIssuedCredential(true);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src={t3Logo} alt="Terminal 3 Logo" className="w-12 h-12 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Terminal 3 Verifiable Credentials Demo - By Jean-Paul Saysana</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentRole('HOLDER')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                currentRole === 'HOLDER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Holder
            </button>
            <button
              onClick={() => setCurrentRole('ISSUER')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                currentRole === 'ISSUER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              <UserCog className="w-4 h-4" />
              Issuer
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Holder/Issuer Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {successMessage && (
              <div className={`mb-4 p-4 rounded-md ${
                successMessage.includes('Error') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {successMessage}
              </div>
            )}
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {currentRole === 'HOLDER' ? (
                <>
                  <User className="w-5 h-5 mr-2" />
                  Request Credential
                </>
              ) : (
                <>
                  <UserCog className="w-5 h-5 mr-2" />
                  Process Request
                </>
              )}
            </h2>

            {currentRole === 'HOLDER' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={holderInfo.fullName}
                      onChange={(e) => setHolderInfo({ ...holderInfo, fullName: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={holderInfo.email}
                      onChange={(e) => setHolderInfo({ ...holderInfo, email: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={holderInfo.phoneNumber}
                      onChange={(e) => setHolderInfo({ ...holderInfo, phoneNumber: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.phoneNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={holderInfo.address}
                      onChange={(e) => setHolderInfo({ ...holderInfo, address: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={holderInfo.occupation}
                      onChange={(e) => setHolderInfo({ ...holderInfo, occupation: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.occupation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.occupation && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.occupation}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Name
                    </label>
                    <input
                      type="text"
                      value={holderInfo.employerName}
                      onChange={(e) => setHolderInfo({ ...holderInfo, employerName: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.employerName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.employerName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.employerName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Income
                    </label>
                    <input
                      type="number"
                      value={holderInfo.annualIncome}
                      onChange={(e) => setHolderInfo({ ...holderInfo, annualIncome: Number(e.target.value) })}
                      className={`w-full px-3 py-2 border ${formErrors.annualIncome ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.annualIncome && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.annualIncome}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assets
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAsset.name}
                          onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                          placeholder="Asset name (e.g., House, Insurance Policy)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="number"
                          value={newAsset.value}
                          onChange={(e) => setNewAsset({ ...newAsset, value: Number(e.target.value) })}
                          placeholder="Value ($)"
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            if (newAsset.name && newAsset.value > 0) {
                              setHolderInfo({
                                ...holderInfo,
                                assets: [...holderInfo.assets, newAsset]
                              });
                              setNewAsset({ name: '', value: 0 });
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Add
                        </button>
                      </div>
                      {holderInfo.assets.length > 0 && (
                        <div className="mt-2 border rounded-md divide-y">
                          {holderInfo.assets.map((asset, index) => (
                            <div key={index} className="flex justify-between items-center p-2">
                              <span>{asset.name}</span>
                              <div className="flex items-center gap-2">
                                <span>${asset.value.toLocaleString()}</span>
                                <button
                                  onClick={() => {
                                    setHolderInfo({
                                      ...holderInfo,
                                      assets: holderInfo.assets.filter((_, i) => i !== index)
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="p-2 bg-gray-50">
                            <span className="font-medium">Total Value: </span>
                            <span>${holderInfo.assets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={holderInfo.dateOfBirth}
                      onChange={(e) => setHolderInfo({ ...holderInfo, dateOfBirth: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.dateOfBirth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={holderInfo.nationality}
                      onChange={(e) => setHolderInfo({ ...holderInfo, nationality: e.target.value })}
                      className={`w-full px-3 py-2 border ${formErrors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {formErrors.nationality && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.nationality}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages
                    </label>
                    <select
                      multiple
                      value={holderInfo.languages}
                      onChange={(e) => setHolderInfo({ 
                        ...holderInfo, 
                        languages: Array.from(e.target.selectedOptions, option => option.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSubmitHolderInfo}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Request
                </button>
              </div>
            )}

            {currentRole === 'ISSUER' && credential && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Holder Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="font-medium">Name:</span> {credential.holderInfo.fullName}</p>
                    <p><span className="font-medium">Email:</span> {credential.holderInfo.email}</p>
                    <p><span className="font-medium">Phone:</span> {credential.holderInfo.phoneNumber}</p>
                    <p><span className="font-medium">Address:</span> {credential.holderInfo.address}</p>
                    <p><span className="font-medium">Occupation:</span> {credential.holderInfo.occupation}</p>
                    <p><span className="font-medium">Employer:</span> {credential.holderInfo.employerName}</p>
                    <p><span className="font-medium">Annual Income:</span> ${credential.holderInfo.annualIncome.toLocaleString()}</p>
                    {credential.holderInfo.assets.length > 0 && (
                      <div className="col-span-2">
                        <p className="font-medium mb-1">Assets:</p>
                        <div className="bg-gray-50 rounded-md p-2">
                          {credential.holderInfo.assets.map((asset, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span>{asset.name}</span>
                              <span>${asset.value.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between items-center font-medium">
                              <span>Total Assets Value:</span>
                              <span>${credential.holderInfo.assets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wealth Threshold ($)
                    </label>
                    <input
                      type="number"
                      value={wealthThreshold}
                      onChange={(e) => setWealthThreshold(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <textarea
                    placeholder="Request additional information..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                  {credential.holderResponse && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">Holder Response:</p>
                      <p className="text-sm text-gray-600 mt-1">{credential.holderResponse}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIssuerAction('request')}
                      className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Request Info
                    </button>
                    <button
                      onClick={() => handleIssuerAction('approve')}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleIssuerAction('reject')}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {credential && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Credential Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Status:</span>
                    <div className="flex items-center">
                      {getStatusIcon(credential.status)}
                      <span className="ml-1">{credential.status}</span>
                    </div>
                  </div>
                  {hasIssuedCredential && credential.id && (
                    <>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Credential ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{credential.id}</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <span>Deployed on Ethereum MainNet</span>
                      </div>
                    </>
                  )}
                  {credential.requestedInfo && credential.requestedInfo.length > 0 && (
                    <div>
                      <span className="font-medium">Additional Information Requested:</span>
                      <ul className="list-disc list-inside mt-1">
                        {credential.requestedInfo.map((info, index) => (
                          <li key={index}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentRole === 'HOLDER' && credential?.status === 'INFO_REQUESTED' && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-900">Additional Information Requested:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {credential.requestedInfo?.map((info, index) => (
                    <li key={index}>{info}</li>
                  ))}
                </ul>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Response
                  </label>
                  <textarea
                    value={holderResponse}
                    onChange={(e) => setHolderResponse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Provide the requested information..."
                  />
                </div>
                <button
                  onClick={handleHolderResponse}
                  disabled={!holderResponse.trim()}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Response
                </button>
              </div>
            )}
          </div>

          {/* Disclosure Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Selective Disclosure
            </h2>
            
            {currentRole === 'HOLDER' && (
              <div className="space-y-4">
                {credential && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Your Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><span className="font-medium">Name:</span> {credential.holderInfo.fullName}</p>
                      <p><span className="font-medium">Email:</span> {credential.holderInfo.email}</p>
                      <p><span className="font-medium">Phone:</span> {credential.holderInfo.phoneNumber}</p>
                      <p><span className="font-medium">Address:</span> {credential.holderInfo.address}</p>
                      <p><span className="font-medium">Occupation:</span> {credential.holderInfo.occupation}</p>
                      <p><span className="font-medium">Employer:</span> {credential.holderInfo.employerName}</p>
                      <p><span className="font-medium">Annual Income:</span> ${credential.holderInfo.annualIncome.toLocaleString()}</p>
                      {credential.holderInfo.assets.length > 0 && (
                        <div className="col-span-2">
                          <p className="font-medium mb-1">Assets:</p>
                          <div className="bg-gray-50 rounded-md p-2">
                            {credential.holderInfo.assets.map((asset, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span>{asset.name}</span>
                                <span>${asset.value.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex justify-between items-center font-medium">
                                <span>Total Assets Value:</span>
                                <span>${credential.holderInfo.assets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {currentRole === 'ISSUER' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wealth Threshold ($)
                  </label>
                  <input
                    type="number"
                    value={wealthThreshold}
                    onChange={(e) => setWealthThreshold(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="1000"
                  />
                </div>
              )}
              <button
                onClick={() => handleDisclose('all')}
                disabled={!credential}
                className="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Disclose All Fields
              </button>
              <button
                onClick={() => handleDisclose('kyc-only')}
                disabled={!credential}
                className={`w-full py-2 px-4 rounded-md disabled:opacity-50 flex items-center justify-center gap-2 ${
                  credential?.fields.kycStatus === 'VERIFIED'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : credential?.fields.kycStatus === 'REJECTED'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {credential?.fields.kycStatus === 'VERIFIED' && <BadgeCheck className="w-4 h-4" />}
                {credential?.fields.kycStatus === 'REJECTED' && <X className="w-4 h-4" />}
                KYC Status Only
              </button>
              <button
                onClick={() => handleDisclose('age-verification')}
                disabled={!credential}
                className={`w-full py-2 px-4 rounded-md disabled:opacity-50 flex items-center justify-center gap-2 ${
                  credential ? (
                    new Date().getFullYear() - new Date(credential.holderInfo.dateOfBirth).getFullYear() >= 18
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  ) : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {credential && (
                  new Date().getFullYear() - new Date(credential.holderInfo.dateOfBirth).getFullYear() >= 18
                    ? <BadgeCheck className="w-4 h-4" />
                    : <X className="w-4 h-4" />
                )}
                Age Verification
              </button>
              <button
                onClick={() => handleDisclose('wealth-threshold')}
                disabled={!credential}
                className={`w-full py-2 px-4 rounded-md disabled:opacity-50 flex items-center justify-center gap-2 ${
                  credential ? (
                    (credential.holderInfo.annualIncome * 3 + credential.holderInfo.assets.reduce((sum, asset) => sum + asset.value, 0)) >= wealthThreshold
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  ) : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {credential && (
                  (credential.holderInfo.annualIncome * 3 + credential.holderInfo.assets.reduce((sum, asset) => sum + asset.value, 0)) >= wealthThreshold
                    ? <BadgeCheck className="w-4 h-4" />
                    : <X className="w-4 h-4" />
                )}
                {currentRole === 'ISSUER' ? (
                  `Wealth Threshold Check ($${wealthThreshold.toLocaleString()})`
                ) : (
                  'Wealth Threshold Check'
                )}
              </button>
            </div>

            {disclosure && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Disclosure Result</h3>
                <div className="space-y-2 text-sm">
                  {disclosure.disclosedFields.kycStatus && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">KYC Status:</span>
                      <div className="flex items-center">
                        {getStatusIcon(disclosure.disclosedFields.kycStatus)}
                        <span className="ml-1">{disclosure.disclosedFields.kycStatus}</span>
                      </div>
                    </div>
                  )}
                  {disclosure.disclosedFields.dateOfBirth && (
                    <p><span className="font-medium">Date of Birth:</span> {disclosure.disclosedFields.dateOfBirth}</p>
                  )}
                  {disclosure.disclosedFields.nationality && (
                    <p><span className="font-medium">Nationality:</span> {disclosure.disclosedFields.nationality}</p>
                  )}
                  {disclosure.disclosedFields.languages && (
                    <p><span className="font-medium">Languages:</span> {disclosure.disclosedFields.languages.join(', ')}</p>
                  )}
                  {disclosure.proofs?.isOver18 !== undefined && (
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Age Verification:</span>
                      {disclosure.proofs.isOver18 ? (
                        <BadgeCheck className="text-green-500" />
                      ) : (
                        <X className="text-red-500" />
                      )}
                    </p>
                  )}
                  {disclosure.proofs?.meetsWealthThreshold !== undefined && (
                    <div>
                      <p className="flex items-center">
                        <span className="font-medium mr-2">
                          Wealth Threshold {currentRole === 'ISSUER' ? `($${wealthThreshold.toLocaleString()})` : ''}:
                        </span>
                        {disclosure.proofs.meetsWealthThreshold ? (
                          <BadgeCheck className="text-green-500" />
                        ) : (
                          <X className="text-red-500" />
                        )}
                      </p>
                      {currentRole === 'ISSUER' && disclosure.disclosedFields.netWorth && (
                        <p className="mt-1 text-gray-600">
                          Net Worth: ${disclosure.disclosedFields.netWorth.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  {disclosure.disclosedFields.kycStatus === 'VERIFIED' && !hasIssuedCredential && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={handleIssueVC}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Issue Verifiable Credential
                      </button>
                    </div>
                  )}
                  {hasIssuedCredential && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="w-full bg-gray-400 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 cursor-not-allowed">
                        <Shield className="w-4 h-4" />
                        Credential Already Issued
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;