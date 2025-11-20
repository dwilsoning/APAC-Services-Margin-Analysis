const axios = require('axios');
const db = require('../models/database');

class CurrencyService {
  constructor() {
    this.cache = {};
    this.lastFetch = null;
    this.CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  }

  /**
   * Get exchange rate from database
   */
  async getExchangeRate(currencyCode) {
    try {
      const rate = await db.get(
        'SELECT rate_to_usd FROM exchange_rates WHERE currency_code = ?',
        [currencyCode]
      );
      return rate ? rate.rate_to_usd : null;
    } catch (error) {
      console.error('Error fetching exchange rate from DB:', error);
      return null;
    }
  }

  /**
   * Update exchange rate in database
   */
  async updateExchangeRate(currencyCode, rateToUsd) {
    try {
      await db.run(
        `INSERT INTO exchange_rates (currency_code, rate_to_usd, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(currency_code)
         DO UPDATE SET rate_to_usd = ?, updated_at = CURRENT_TIMESTAMP`,
        [currencyCode, rateToUsd, rateToUsd]
      );
      return true;
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      return false;
    }
  }

  /**
   * Fetch latest exchange rates from API and update database
   */
  async fetchAndUpdateRates() {
    try {
      console.log('Fetching latest exchange rates from API...');
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 5000
      });

      if (response.data && response.data.rates) {
        const currencies = ['AUD', 'EUR', 'GBP', 'SGD', 'NZD'];

        for (const currency of currencies) {
          if (response.data.rates[currency]) {
            const rateToUsd = 1 / response.data.rates[currency];
            await this.updateExchangeRate(currency, rateToUsd);
            this.cache[currency] = rateToUsd;
          }
        }

        // USD is always 1
        await this.updateExchangeRate('USD', 1.0);
        this.cache['USD'] = 1.0;

        this.lastFetch = Date.now();
        console.log('✓ Exchange rates updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching exchange rates from API:', error.message);
      return false;
    }
  }

  /**
   * Get all exchange rates
   */
  async getAllRates() {
    try {
      const rates = await db.all('SELECT * FROM exchange_rates ORDER BY currency_code');
      return rates;
    } catch (error) {
      console.error('Error fetching all exchange rates:', error);
      return [];
    }
  }

  /**
   * Convert amount from local currency to USD
   */
  async convertToUSD(amount, currencyCode) {
    try {
      // If already USD, return as is
      if (currencyCode === 'USD') {
        return amount;
      }

      // Try to get rate from cache first
      let rate = this.cache[currencyCode];

      // If not in cache or cache is old, get from database
      if (!rate || !this.lastFetch || (Date.now() - this.lastFetch > this.CACHE_DURATION)) {
        rate = await this.getExchangeRate(currencyCode);
        if (rate) {
          this.cache[currencyCode] = rate;
        }
      }

      // If still no rate, try to fetch from API
      if (!rate) {
        await this.fetchAndUpdateRates();
        rate = this.cache[currencyCode];
      }

      // If we still don't have a rate, throw error
      if (!rate) {
        throw new Error(`Exchange rate not available for ${currencyCode}`);
      }

      return amount * rate;
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Initialize cache from database
   */
  async initializeCache() {
    try {
      const rates = await this.getAllRates();
      rates.forEach(rate => {
        this.cache[rate.currency_code] = rate.rate_to_usd;
      });
      this.lastFetch = Date.now();
      console.log('✓ Currency cache initialized');
    } catch (error) {
      console.error('Error initializing currency cache:', error);
    }
  }
}

module.exports = new CurrencyService();
