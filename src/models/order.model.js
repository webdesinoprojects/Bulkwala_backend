import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: "India" },
    },

    paymentMode: {
      type: String,
      enum: ["Cash on Delivery", "UPI", "Net Banking", "Card"],
      required: true,
    },

    transactionId: {
      type: String,
      default: null,
    },

    itemsPrice: {
      type: Number,
      required: true,
    },
    shippingPrice: {
      type: Number,
      required: true,
    },
    taxPrice: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
    },

    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  try {
    this.itemsPrice = this.products.reduce(
      (sum, item) => sum + item.priceAtPurchase * item.quantity,
      0
    );
    this.totalPrice = this.itemsPrice + this.shippingPrice + this.taxPrice;
    next();
  } catch (err) {
    next(err);
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
