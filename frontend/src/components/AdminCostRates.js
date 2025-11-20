import React, { useState, useEffect } from 'react';
import { adminRatesAPI } from '../services/api';

const AdminCostRates = () => {
  const [rates, setRates] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingRates, setEditingRates] = useState({});

  useEffect(() => {
    fetchRates();
    fetchExchangeRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await adminRatesAPI.getRates();
      setRates(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cost rates');
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await adminRatesAPI.getExchangeRates();
      setExchangeRates(response.data);
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
    }
  };

  const handleRateChange = (id, value) => {
    setEditingRates(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  const handleSaveRate = async (rate) => {
    try {
      const newRate = editingRates[rate.id] ?? rate.cost_rate_usd;
      await adminRatesAPI.updateRate(rate.id, { cost_rate_usd: newRate });
      setSuccess('Cost rate updated successfully');
      fetchRates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update cost rate');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSaveAllRates = async () => {
    try {
      const ratesToUpdate = Object.entries(editingRates).map(([id, cost_rate_usd]) => ({
        id: parseInt(id),
        cost_rate_usd
      }));

      if (ratesToUpdate.length === 0) {
        setError('No changes to save');
        setTimeout(() => setError(null), 3000);
        return;
      }

      await adminRatesAPI.bulkUpdateRates(ratesToUpdate);
      setSuccess(`Updated ${ratesToUpdate.length} cost rates successfully`);
      setEditingRates({});
      fetchRates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update cost rates');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRefreshExchangeRates = async () => {
    try {
      setLoading(true);
      await adminRatesAPI.refreshExchangeRates();
      fetchExchangeRates();
      setSuccess('Exchange rates refreshed from API');
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to refresh exchange rates');
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading cost rates...</div>;
  }

  return (
    <div className="admin-cost-rates">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Resource Cost Rates */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Resource Cost Rates (USD per hour)</span>
            <button
              onClick={handleSaveAllRates}
              className="btn btn-success"
              disabled={Object.keys(editingRates).length === 0}
            >
              💾 Save All Changes
            </button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Resource Type</th>
              <th>Cost Rate (USD)</th>
              <th>Effective Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id}>
                <td style={{ fontWeight: 500 }}>{rate.resource_type}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingRates[rate.id] ?? rate.cost_rate_usd}
                    onChange={(e) => handleRateChange(rate.id, e.target.value)}
                    className="form-control"
                    style={{ width: '150px' }}
                  />
                </td>
                <td>{rate.effective_date || 'N/A'}</td>
                <td>
                  <button
                    onClick={() => handleSaveRate(rate)}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exchange Rates */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Exchange Rates (to USD)</span>
            <button onClick={handleRefreshExchangeRates} className="btn btn-secondary">
              🔄 Refresh from API
            </button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Rate to USD</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {exchangeRates.map(rate => (
              <tr key={rate.id}>
                <td style={{ fontWeight: 500 }}>{rate.currency_code}</td>
                <td>{rate.rate_to_usd.toFixed(4)}</td>
                <td>{new Date(rate.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
          <strong>Note:</strong> Exchange rates are automatically fetched from an external API.
          The "Rate to USD" shows how much USD you get for 1 unit of the currency.
          For example, if AUD rate is 0.65, it means 1 AUD = 0.65 USD.
        </div>
      </div>
    </div>
  );
};

export default AdminCostRates;
