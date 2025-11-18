import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import Offer from "../models/offer.model.js";
import Referral from "../models/referral.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { calculateCartTotals } from "../utils/cartUtils.js";

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  // ✅ Validate product exists, is active, and not deleted
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (product.isDeleted)
    throw new ApiError(400, "Product is no longer available");
  if (!product.isActive)
    throw new ApiError(400, "Product is currently unavailable");

  // ✅ Validate stock availability
  const requestedQuantity = quantity || 1;
  if (requestedQuantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }

  let cart = await Cart.findOne({ user: userId });

  // ✅ Calculate total quantity (existing + new)
  let totalQuantity = requestedQuantity;
  if (cart) {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (existingItem) {
      totalQuantity = existingItem.quantity + requestedQuantity;
    }
  }

  // ✅ Check if total quantity exceeds available stock
  if (totalQuantity > product.stock) {
    const availableStock = product.stock;
    const existingQty =
      cart?.items.find((item) => item.product.toString() === productId)
        ?.quantity || 0;

    if (existingQty > 0) {
      throw new ApiError(
        400,
        `Only ${availableStock} items available in stock. You already have ${existingQty} in your cart.`
      );
    } else {
      throw new ApiError(
        400,
        `Only ${availableStock} items available in stock.`
      );
    }
  }

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [{ product: productId, quantity: requestedQuantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += requestedQuantity;
    } else {
      cart.items.push({ product: productId, quantity: requestedQuantity });
    }
  }

  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);

    // 🧩 Guard: if coupon was deleted or invalid, reset it
    if (!coupon) {
      cart.coupon = null;
      cart.discount = 0;
    } else {
      const productIds = cart.items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds } });
      const newTotal = cart.items.reduce((acc, item) => {
        const prod = products.find(
          (p) => p._id.toString() === item.product.toString()
        );
        const price =
          prod?.discountPrice && prod.discountPrice > 0
            ? prod.discountPrice
            : prod?.price || 0;
        return acc + price * item.quantity;
      }, 0);

      if (newTotal < coupon.minOrderValue) {
        cart.coupon = null;
        cart.discount = 0;
      }
    }
  }

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart successfully"));
});

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select:
      "title price discountPrice images description stock isActive isDeleted",
  });

  // ✅ Return empty cart structure instead of 404 (better UX)
  if (!cart || cart.items.length === 0) {
    if (cart && cart.items.length === 0) {
      cart.referralCode = null;
      cart.referralDiscount = 0;
      await cart.save();
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: [],
          itemsPrice: 0,
          shippingPrice: 0,
          totalPrice: 0,
          totalItems: 0,
          discount: 0,
          couponApplied: false,
          couponCode: "",
          flashDiscount: 0,
          flashDiscountPercent: 0,
          referralApplied: false,
          referralCode: null,
          referralDiscount: 0,
        },
        "Cart is empty"
      )
    );
  }

  // ✅ Filter out deleted/inactive products and adjust quantities for low stock
  const validItems = [];
  const removedProducts = [];

  for (const item of cart.items) {
    const product = item.product;

    // Skip if product is null (deleted)
    if (!product) {
      removedProducts.push(item.product?.toString() || "unknown");
      continue;
    }

    // Skip if product is deleted or inactive
    if (product.isDeleted || !product.isActive) {
      removedProducts.push(product._id.toString());
      continue;
    }

    // ✅ Adjust quantity if it exceeds available stock
    if (item.quantity > product.stock) {
      if (product.stock > 0) {
        // Reduce quantity to available stock
        item.quantity = product.stock;
        validItems.push(item);
      } else {
        // Remove out of stock items
        removedProducts.push(product._id.toString());
        continue;
      }
    } else {
      validItems.push(item);
    }
  }

  // ✅ Update cart if items were removed
  if (removedProducts.length > 0 || validItems.length !== cart.items.length) {
    cart.items = validItems;
    // Reset coupon if cart becomes empty
    if (cart.items.length === 0) {
      cart.coupon = null;
      cart.discount = 0;
      cart.referralCode = null;
      cart.referralDiscount = 0;
    }
    await cart.save();
  }

  // ✅ Return empty cart if all items were invalid
  if (validItems.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: [],
          itemsPrice: 0,
          shippingPrice: 0,
          totalPrice: 0,
          totalItems: 0,
          discount: 0,
          couponApplied: false,
          couponCode: "",
          flashDiscount: 0,
          flashDiscountPercent: 0,
          referralApplied: false,
          referralCode: null,
          referralDiscount: 0,
        },
        removedProducts.length > 0
          ? "Some products are no longer available. Cart has been updated."
          : "Cart is empty"
      )
    );
  }

  // ✅ Calculate subtotal and total (using valid items)
  const itemsPrice = validItems.reduce((acc, item) => {
    const price =
      item.product?.discountPrice && item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const shippingPrice = itemsPrice > 297 ? 0 : 50;
  let totalPrice = itemsPrice + shippingPrice;

  // ✅ Apply discount if coupon exists
  if (cart.discount > 0) {
    totalPrice -= cart.discount;
    if (totalPrice < 0) totalPrice = 0;
  }

  const totalItems = validItems.reduce((acc, item) => acc + item.quantity, 0);

  const couponApplied = !!cart.coupon;
  let couponCode = "";
  if (cart.coupon) {
    const appliedCoupon = await Coupon.findById(cart.coupon);
    couponCode = appliedCoupon ? appliedCoupon.code : "";
  }

  // ✅ Apply referral discount if present
  if (cart.referralDiscount > 0) {
    totalPrice -= cart.referralDiscount;
    if (totalPrice < 0) totalPrice = 0;
  }

  // ✅ Check active flash offer
  const activeOffer = await Offer.findOne({ isActive: true });
  let flashDiscount = 0;
  let flashDiscountPercent = 0;

  // 🔒 Ensure only one offer type applies at a time
  if (cart.coupon) {
    if (process.env.NODE_ENV === "development") {
      console.log("Coupon applied — skipping referral and flash offer");
    }
    cart.referralCode = null;
    cart.referralDiscount = 0;
  } else if (cart.referralCode) {
    if (process.env.NODE_ENV === "development") {
      console.log("Referral applied — skipping coupon and flash offer");
    }
  } else if (activeOffer && activeOffer.expiresAt > Date.now()) {
    if (process.env.NODE_ENV === "development") {
      console.log("Flash offer active — applying flash discount only");
    }

    flashDiscountPercent = activeOffer.discountPercent;

    // ✅ Calculate capped discount (e.g. 90% off up to ₹50)
    const rawDiscount = (totalPrice * flashDiscountPercent) / 100;
    flashDiscount = Math.min(
      rawDiscount,
      activeOffer.maxDiscountAmount || rawDiscount
    );

    totalPrice -= flashDiscount;

    if (totalPrice < 0) totalPrice = 0;
  }

  const cartData = {
    ...cart.toObject(),
    items: validItems, // Use filtered valid items
    itemsPrice,
    shippingPrice,
    totalPrice,
    totalItems,
    discount: cart.discount || 0,
    flashDiscount,
    flashDiscountPercent,
    couponApplied,
    couponCode,
    referralCode: cart.referralCode,
    referralDiscount: cart.referralDiscount,
  };

  // Optional: Log cart data (for debugging purposes)
  if (process.env.NODE_ENV === "development") {
    console.log("Cart Data:", cartData);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, cartData, "Cart fetched successfully"));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  // ✅ Validate quantity
  if (!quantity || quantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) throw new ApiError(404, "Item not found in cart");

  // ✅ Validate product still exists and is available
  const product = await Product.findById(productId);
  if (!product) {
    // Remove invalid product from cart
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();
    throw new ApiError(404, "Product no longer available. Removed from cart.");
  }
  if (product.isDeleted || !product.isActive) {
    // Remove unavailable product from cart
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();
    throw new ApiError(
      400,
      "Product is no longer available. Removed from cart."
    );
  }

  // ✅ Validate stock availability
  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} items available in stock.`);
  }

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
    cart.referralCode = null;
    cart.referralDiscount = 0;
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

  // ⭐ FIX: reset referral completely
  cart.referralCode = null;
  cart.referralDiscount = 0;

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

  if (cart.referralCode)
    throw new ApiError(400, "Remove referral before applying a coupon");

  const activeOffer = await Offer.findOne({ isActive: true });
  if (activeOffer && activeOffer.expiresAt > Date.now())
    throw new ApiError(400, "Cannot apply coupon during active flash offer");

  const coupon = await Coupon.findOne({ code: couponCode?.toUpperCase() });
  if (!coupon) throw new ApiError(400, "Invalid coupon code");
  if (coupon.expiryDate < Date.now()) throw new ApiError(400, "Coupon expired");
  if (coupon.usedCount >= coupon.usageLimit)
    throw new ApiError(400, "Coupon usage limit reached");
  if (coupon.usedBy.includes(userId))
    throw new ApiError(400, "You have already used this coupon");

  //  Use helper function
  const { totalBeforeDiscount } = calculateCartTotals(cart);

  if (totalBeforeDiscount < coupon.minOrderValue)
    throw new ApiError(
      400,
      `Minimum order value ₹${coupon.minOrderValue} required`
    );

  let discount =
    coupon.discountType === "percentage"
      ? (totalBeforeDiscount * coupon.discountValue) / 100
      : coupon.discountValue;

  if (discount > totalBeforeDiscount) discount = totalBeforeDiscount;

  //  Final total after applying coupon
  const finalAmount = Math.max(totalBeforeDiscount - discount, 0);

  // update cart
  cart.coupon = coupon._id;
  cart.discount = discount;
  await cart.save();

  //  Update coupon usage and sales
  coupon.usedCount += 1;
  coupon.usedBy.push(userId);
  coupon.totalSales += finalAmount; // use final discounted total
  await coupon.save();

  return res.status(200).json(
    new ApiResponse(200, {
      success: true,
      message: "Coupon applied successfully",
      coupon: coupon.code,
      discount,
      totalAfterDiscount: totalBeforeDiscount - discount,
      cart,
    })
  );
});

const removeCoupon = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) throw new ApiError(404, "Cart not found");

  if (!cart.coupon)
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No coupon applied on this cart"));

  const coupon = await Coupon.findById(cart.coupon);
  if (coupon) {
    const wasUsed = coupon.usedBy.includes(userId);
    if (wasUsed) {
      const { totalBeforeDiscount } = calculateCartTotals(cart);

      // ✅ Calculate discount again to find the real deducted sale
      const discount =
        coupon.discountType === "percentage"
          ? (totalBeforeDiscount * coupon.discountValue) / 100
          : coupon.discountValue;

      const finalAmount = Math.max(totalBeforeDiscount - discount, 0);

      // ✅ Reverse totalSales by finalAmount only
      coupon.totalSales = Math.max(0, coupon.totalSales - finalAmount);

      // ✅ Update usage info
      coupon.usedBy = coupon.usedBy.filter(
        (uid) => uid.toString() !== userId.toString()
      );
      if (coupon.usedCount > 0) coupon.usedCount -= 1;

      await coupon.save();
    }
  }

  // ✅ Reset coupon in cart
  cart.coupon = null;
  cart.discount = 0;
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Coupon removed successfully"));
});

const applyReferral = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { referralCode } = req.body;

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0)
    throw new ApiError(404, "Your cart is empty");

  if (cart.coupon)
    throw new ApiError(400, "Remove coupon before applying a referral");

  const activeOffer = await Offer.findOne({ isActive: true });
  if (activeOffer && activeOffer.expiresAt > Date.now())
    throw new ApiError(400, "Cannot apply referral during active flash offer");

  const referral = await Referral.findOne({
    code: referralCode?.toUpperCase(),
  });
  if (!referral) throw new ApiError(400, "Invalid referral code");
  if (referral.usedBy.includes(userId))
    throw new ApiError(400, "You have already used this referral code");

  // ✅ Use helper to calculate totals
  const { totalBeforeDiscount } = calculateCartTotals(cart);

  // ✅ Calculate referral discount
  const discount = (totalBeforeDiscount * referral.discountPercent) / 100;

  // ✅ Calculate final payable amount
  const finalAmount = Math.max(totalBeforeDiscount - discount, 0);

  // ✅ Update cart with referral details
  cart.referralCode = referral.code;
  cart.referralDiscount = discount;
  await cart.save();

  // ✅ Update referral stats (add only net sales after discount)
  referral.usedBy.push(userId);
  referral.usageCount += 1;
  referral.totalSales += finalAmount; // previously totalBeforeDiscount
  await referral.save();

  return res.status(200).json(
    new ApiResponse(200, {
      success: true,
      message: "Referral applied successfully",
      referral: referral.code,
      discount,
      totalAfterDiscount: finalAmount,
      cart,
    })
  );
});

const removeReferral = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) throw new ApiError(404, "Cart not found");

  if (!cart.referralCode) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No referral applied on this cart"));
  }

  const referral = await Referral.findOne({ code: cart.referralCode });
  if (referral) {
    const wasUsed = referral.usedBy.includes(userId);
    if (wasUsed) {
      // ✅ Recalculate totalBeforeDiscount and discount
      const { totalBeforeDiscount } = calculateCartTotals(cart);
      const discount = (totalBeforeDiscount * referral.discountPercent) / 100;
      const finalAmount = Math.max(totalBeforeDiscount - discount, 0);

      // ✅ Reverse totalSales safely (subtract finalAmount)
      referral.totalSales = Math.max(0, referral.totalSales - finalAmount);

      // ✅ Update usage stats
      referral.usedBy = referral.usedBy.filter(
        (uid) => uid.toString() !== userId.toString()
      );
      if (referral.usageCount > 0) referral.usageCount -= 1;

      await referral.save();
    }
  }

  // ✅ Reset cart
  cart.referralCode = null;
  cart.referralDiscount = 0;
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Referral removed successfully"));
});

export {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  applyReferral,
  removeReferral,
};
