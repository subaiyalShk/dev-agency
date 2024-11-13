export function calculatePercentage(value, max) {
    return Math.round((value / max) * 100);
  }
  
  export function monthsToWeeks(months) {
    return Math.round(months * 4.345);
  }
  
  export function weeksToMonths(weeks) {
    return Math.round(weeks / 4.345 * 10) / 10;
  }
  
  export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  export function calculateRiskLevel(percentage) {
    if (percentage >= 80) return { level: 'Low Risk', color: 'bg-green-500' };
    if (percentage >= 60) return { level: 'Moderate Risk', color: 'bg-yellow-500' };
    if (percentage >= 40) return { level: 'High Risk', color: 'bg-orange-500' };
    return { level: 'Critical Risk', color: 'bg-red-500' };
  }
  