/**
 * Margin Analysis Calculation Service
 * Handles all financial calculations for projects
 */

class CalculationService {
  /**
   * Calculate total costs from resources
   * @param {Array} projectResources - Array of {resource_type, hours, cost_rate_usd}
   * @param {Array} thirdPartyResources - Array of {resource_name, cost_usd, hours}
   * @param {Number} nonBillHours - Non-billable hours
   * @param {Number} avgCostRate - Average cost rate for non-bill hours calculation
   * @returns {Object} Cost breakdown
   */
  calculateTotalCosts(projectResources, thirdPartyResources, nonBillHours = 0, avgCostRate = 0) {
    // Calculate predefined resource costs
    const predefinedResourceCosts = projectResources.reduce((sum, resource) => {
      return sum + (resource.hours * resource.cost_rate_usd);
    }, 0);

    // Calculate third-party costs
    const thirdPartyCosts = thirdPartyResources.reduce((sum, resource) => {
      return sum + resource.cost_usd;
    }, 0);

    // Calculate non-bill hours cost
    const nonBillCosts = nonBillHours * avgCostRate;

    // Total costs
    const totalCosts = predefinedResourceCosts + thirdPartyCosts + nonBillCosts;

    return {
      predefinedResourceCosts,
      thirdPartyCosts,
      nonBillCosts,
      totalCosts
    };
  }

  /**
   * Calculate margin percentage
   * Formula: (EBITA / Local Service Value in USD) × 100
   */
  calculateMargin(ebita, serviceValueUSD) {
    if (serviceValueUSD === 0) {
      return 0;
    }
    return (ebita / serviceValueUSD) * 100;
  }

  /**
   * Calculate Net Revenue
   * Formula: Local Service Value in USD - COGS (Third Party Costs)
   * COGS = Third-party costs only (not internal resources)
   */
  calculateNetRevenue(serviceValueUSD, thirdPartyCosts) {
    return serviceValueUSD - thirdPartyCosts;
  }

  /**
   * Calculate EBITA
   * Formula: Local Service Value in USD - Total Costs
   */
  calculateEBITA(serviceValueUSD, totalCosts) {
    return serviceValueUSD - totalCosts;
  }

  /**
   * Calculate Professional Services Ratio
   * Formula: Net Revenue / OPEX
   * OPEX = Non-Third Party Costs (predefined resource costs)
   */
  calculatePSRatio(netRevenue, opex) {
    if (opex === 0) {
      return 0;
    }
    return netRevenue / opex;
  }

  /**
   * Determine margin status
   */
  getMarginStatus(marginPercent) {
    return marginPercent >= 40 ? 'On Track' : 'Below Target';
  }

  /**
   * Determine PS Ratio status
   */
  getPSRatioStatus(psRatio) {
    return psRatio >= 2.0 ? 'On Track' : 'Below Target';
  }

  /**
   * Calculate all project metrics
   * @param {Number} serviceValueUSD - Service value in USD
   * @param {Array} projectResources - Predefined resources
   * @param {Array} thirdPartyResources - Third-party resources
   * @param {Number} nonBillHours - Non-billable hours
   * @returns {Object} All calculated metrics
   */
  calculateProjectMetrics(serviceValueUSD, projectResources, thirdPartyResources, nonBillHours = 0) {
    // Calculate average cost rate for non-bill hours
    let avgCostRate = 0;
    if (projectResources.length > 0) {
      const totalRate = projectResources.reduce((sum, r) => sum + r.cost_rate_usd, 0);
      avgCostRate = totalRate / projectResources.length;
    }

    // Calculate total costs breakdown
    const costs = this.calculateTotalCosts(
      projectResources,
      thirdPartyResources,
      nonBillHours,
      avgCostRate
    );

    // Calculate all metrics
    const netRevenue = this.calculateNetRevenue(serviceValueUSD, costs.thirdPartyCosts);
    const ebita = this.calculateEBITA(serviceValueUSD, costs.totalCosts);
    const margin = this.calculateMargin(ebita, serviceValueUSD);
    const psRatio = this.calculatePSRatio(netRevenue, costs.predefinedResourceCosts);

    // Determine statuses
    const marginStatus = this.getMarginStatus(margin);
    const psRatioStatus = this.getPSRatioStatus(psRatio);

    return {
      totalCostsUsd: Math.round(costs.totalCosts),
      baselineMarginPercent: Math.round(margin), // Round to integer
      netRevenueUsd: Math.round(netRevenue),
      ebitaUsd: Math.round(ebita),
      psRatio: Math.round(psRatio * 100) / 100,
      marginStatus,
      psRatioStatus,
      breakdown: {
        predefinedResourceCosts: costs.predefinedResourceCosts,
        thirdPartyCosts: costs.thirdPartyCosts,
        nonBillCosts: costs.nonBillCosts
      }
    };
  }

  /**
   * Calculate baseline metrics using baseline hours
   * @param {Number} serviceValueUSD - Service value in USD
   * @param {Array} projectResources - Array with baseline_hours field
   * @param {Array} thirdPartyResources - Third party costs
   * @returns {Object} Baseline metrics
   */
  calculateBaselineMetrics(serviceValueUSD, projectResources, thirdPartyResources) {
    // Calculate baseline costs using baseline hours
    const baselineResourcesForCalc = projectResources.map(r => ({
      hours: r.baseline_hours || 0,
      cost_rate_usd: r.cost_rate_usd
    }));

    const costs = this.calculateTotalCosts(
      baselineResourcesForCalc,
      thirdPartyResources,
      0, // No non-bill hours for baseline
      0
    );

    const netRevenue = this.calculateNetRevenue(serviceValueUSD, costs.thirdPartyCosts);
    const ebita = this.calculateEBITA(serviceValueUSD, costs.totalCosts);
    const margin = this.calculateMargin(ebita, serviceValueUSD);
    const psRatio = this.calculatePSRatio(netRevenue, costs.predefinedResourceCosts);

    return {
      baselineTotalCostsUsd: Math.round(costs.totalCosts),
      baselineMarginPercent: Math.round(margin), // Round to integer
      baselineNetRevenueUsd: Math.round(netRevenue),
      baselineEbitaUsd: Math.round(ebita),
      baselinePsRatio: Math.round(psRatio * 100) / 100
    };
  }

  /**
   * Validate that total baseline hours match sum of resource hours
   */
  validateBaselineHours(totalBaselineHours, projectResources, nonBillHours = 0) {
    const sumOfResourceHours = projectResources.reduce((sum, r) => sum + r.hours, 0);
    const calculatedTotal = sumOfResourceHours + nonBillHours;

    return {
      isValid: Math.abs(totalBaselineHours - calculatedTotal) < 0.01, // Allow for floating point errors
      totalBaselineHours,
      sumOfResourceHours,
      nonBillHours,
      calculatedTotal,
      difference: totalBaselineHours - calculatedTotal
    };
  }
}

module.exports = new CalculationService();
