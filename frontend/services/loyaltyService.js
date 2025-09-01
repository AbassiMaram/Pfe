// frontend/services/loyaltyService.js
export const calculateLoyaltyPoints = (items, multipliers) => {
  if (!items || !multipliers) return 0;

  return items.reduce((totalPoints, item) => {
    if (!item?.price || !item?.quantity || item.price <= 0 || item.quantity <= 0) {
      return totalPoints;
    }

    const normalizedCategory = item.category
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || 'default';

    const multiplier = multipliers[normalizedCategory] || multipliers.default || 1.0;
    return totalPoints + Math.round(item.price * item.quantity * multiplier * 10);
  }, 0);
};