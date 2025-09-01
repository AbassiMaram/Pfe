// src/services/pointsService.js
const calculateOrderPoints = (order) => {
  const { items, multipliers = {} } = order;

  return items.reduce((total, item) => {
    if (item.price <= 0 || item.quantity <= 0) return total;

    const category = normalizeCategory(item.category);
    const multiplier = multipliers[category] || 1.0;
    
    return total + Math.round(item.price * item.quantity * multiplier * 10);
  }, 0);
};

const normalizeCategory = (category) => {
  return category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'default';
};

module.exports = { calculateOrderPoints };