export const calculateCartTotals = (cart) => {
  if (!cart?.items || cart.items.length === 0) {
    return {
      itemsPrice: 0,
      shippingPrice: 0,
      taxPrice: 0,
      totalBeforeDiscount: 0,
    };
  }

  const itemsPrice = cart.items.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const shippingPrice = itemsPrice > 1000 ? 0 : 50;
  const taxPrice = itemsPrice * 0.18;
  const totalBeforeDiscount = itemsPrice + shippingPrice + taxPrice;

  return { itemsPrice, shippingPrice, taxPrice, totalBeforeDiscount };
};
