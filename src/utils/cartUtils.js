export const calculateCartTotals = (cart) => {
  if (!cart?.items || cart.items.length === 0) {
    return {
      itemsPrice: 0,
      shippingPrice: 0,
      totalBeforeDiscount: 0,
    };
  }

  // ✅ Use discountPrice if available, else fallback to price
  const itemsPrice = cart.items.reduce((acc, item) => {
    const price =
      item.product?.discountPrice && item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const shippingPrice = itemsPrice > 297 ? 0 : 50;
  const totalBeforeDiscount = itemsPrice + shippingPrice;

  return { itemsPrice, shippingPrice, totalBeforeDiscount };
};
