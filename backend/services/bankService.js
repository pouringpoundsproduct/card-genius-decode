
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
      return false;
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
