import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Coupon from "../models/coupon.model.js";
import Offer from "../models/offer.model.js";

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({ product: productId, quantity });
    }
  }

  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);
    const productIds = cart.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const newTotal = cart.items.reduce((acc, item) => {
      const prod = products.find(
        (p) => p._id.toString() === item.product.toString()
      );
      return acc + (prod?.price || 0) * item.quantity;
    }, 0);

    if (newTotal < coupon.minOrderValue) {
      cart.coupon = null;
      cart.discount = 0;
    }
  }

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart successfully"));
});

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "title price images description"
  );

  if (!cart || cart.items.length === 0)
    throw new ApiError(404, "Your cart is empty");

  //  Calculate subtotal and total
  const itemsPrice = cart.items.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const shippingPrice = itemsPrice > 1000 ? 0 : 50;
  const taxPrice = itemsPrice * 0.18;
  let totalPrice = itemsPrice + shippingPrice + taxPrice;

  // ✅ Apply discount if coupon exists
  if (cart.discount > 0) {
    totalPrice -= cart.discount;
    if (totalPrice < 0) totalPrice = 0;
  }

  const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  const couponApplied = !!cart.coupon;
  let couponCode = "";
  if (cart.coupon) {
    const appliedCoupon = await Coupon.findById(cart.coupon);
    couponCode = appliedCoupon ? appliedCoupon.code : "";
  }

  // ✅ Check active flash offer
  const activeOffer = await Offer.findOne({ isActive: true });

  let flashDiscount = 0;
  let flashDiscountPercent = 0;

  if (cart.coupon) {
    console.log("Coupon applied — skipping flash offer");
  } else if (activeOffer && activeOffer.expiresAt > Date.now()) {
    flashDiscountPercent = activeOffer.discountPercent;
    flashDiscount = (totalPrice * flashDiscountPercent) / 100;
    totalPrice -= flashDiscount;
  }

  const cartData = {
    ...cart.toObject(),
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    totalItems,
    discount: cart.discount || 0,
    flashDiscount,
    flashDiscountPercent,
    couponApplied,
    couponCode,
  };

  // Optional: Log cart data (for debugging purposes)
  console.log("Cart Data:", cartData);

  return res
    .status(200)
    .json(new ApiResponse(200, cartData, "Cart fetched successfully"));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) throw new ApiError(404, "Item not found in cart");

  item.quantity = quantity;
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart item updated successfully"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  // If no items left → reset coupon
  if (cart.items.length === 0) {
    cart.coupon = null;
    cart.discount = 0;
  }

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart successfully"));
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = [];
  cart.discount = 0;
  cart.coupon = null;

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart cleared successfully"));
});

const applyCoupon = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { couponCode } = req.body;

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0)
    throw new ApiError(404, "Your cart is empty");

  const coupon = await Coupon.findOne({ code: couponCode?.toUpperCase() });
  if (!coupon) throw new ApiError(400, "Invalid coupon code");
  if (coupon.expiryDate < Date.now()) throw new ApiError(400, "Coupon expired");
  if (coupon.usedCount >= coupon.usageLimit)
    throw new ApiError(400, "Coupon usage limit reached");

  // calculate total
  const itemsPrice = cart.items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const shippingPrice = itemsPrice > 1000 ? 0 : 50;
  const taxPrice = itemsPrice * 0.18;
  const total = itemsPrice + shippingPrice + taxPrice;

  if (total < coupon.minOrderValue)
    throw new ApiError(
      400,
      `Minimum order value ₹${coupon.minOrderValue} required`
    );

  // calculate discount
  let discount =
    coupon.discountType === "percentage"
      ? (total * coupon.discountValue) / 100
      : coupon.discountValue;

  if (discount > total) discount = total;

  // ✅ update cart
  cart.coupon = coupon._id;
  cart.discount = discount;
  await cart.save();

  return res.status(200).json(
    new ApiResponse(200, {
      success: true,
      message: "Coupon applied successfully",
      coupon: coupon.code,
      discount,
      totalAfterDiscount: total - discount,
      cart,
    })
  );
});

const removeCoupon = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.coupon = null;
  cart.discount = 0;
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Coupon removed successfully"));
});

export {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
};
