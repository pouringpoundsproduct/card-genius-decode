const axios = require('axios');
const { API_ENDPOINTS } = require('../config/apiConfig');

class BankService {
  constructor() {
    this.bankCache = null;
    this.bankMappings = new Map();
    this.lastCacheUpdate = 0;
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  }

  async initializeBankMappings() {
    try {
      console.log('Initializing bank mappings...');
      const response = await axios.post(API_ENDPOINTS.BANK_TAGS, {}, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data && response.data.data && response.data.data.banks) {
        this.bankCache = response.data.data;
        this.bankMappings.clear();
        
        response.data.data.banks.forEach(bank => {
          this.bankMappings.set(bank.id.toString(), {
            name: bank.name,
            logo: bank.logo || '',
            ...bank
          });
        });
        
        this.lastCacheUpdate = Date.now();
        console.log(`Bank mappings initialized: ${this.bankMappings.size} banks loaded`);
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize bank mappings:', error.message);
      console.log('🔄 Using fallback bank mappings...');
      await this.loadFallbackBankMappings();
      return false;
    }
  }

  /**
   * Load fallback bank mappings when API is unavailable
   */
  async loadFallbackBankMappings() {
    try {
      const fallbackBanks = [
        { id: 1, name: 'HDFC Bank', logo: '' },
        { id: 2, name: 'ICICI Bank', logo: '' },
        { id: 3, name: 'State Bank of India', logo: '' },
        { id: 4, name: 'Axis Bank', logo: '' },
        { id: 5, name: 'Kotak Mahindra Bank', logo: '' },
        { id: 6, name: 'Yes Bank', logo: '' },
        { id: 7, name: 'IndusInd Bank', logo: '' },
        { id: 8, name: 'RBL Bank', logo: '' },
        { id: 9, name: 'Federal Bank', logo: '' },
        { id: 10, name: 'IDFC First Bank', logo: '' }
      ];

      this.bankCache = { banks: fallbackBanks };
      this.bankMappings.clear();
      
      fallbackBanks.forEach(bank => {
        this.bankMappings.set(bank.id.toString(), {
          name: bank.name,
          logo: bank.logo || '',
          ...bank
        });
      });
      
      this.lastCacheUpdate = Date.now();
      console.log(`Fallback bank mappings loaded: ${this.bankMappings.size} banks`);
    } catch (error) {
      console.error('Failed to load fallback bank mappings:', error.message);
    }
  }

  getBankInfo(bankId) {
    const id = bankId?.toString();
    return this.bankMappings.get(id) || { name: 'Unknown Bank', logo: '' };
  }

  findBankIdByName(bankName) {
    const name = bankName.toLowerCase();
    for (let [id, bank] of this.bankMappings) {
      if (bank.name.toLowerCase().includes(name) || name.includes(bank.name.toLowerCase().split(' ')[0])) {
        return id;
      }
    }
    return null;
  }

  async ensureBankMappingsLoaded() {
    if (!this.bankCache || Date.now() - this.lastCacheUpdate > this.CACHE_DURATION) {
      await this.initializeBankMappings();
    }
  }

  getBankCache() {
    return this.bankCache;
  }

  getBankMappings() {
    return this.bankMappings;
  }
}

module.exports = new BankService();
