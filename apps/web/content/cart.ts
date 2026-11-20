/** Copy for the cart drawer and the /cart page. */
export const cartContent = {
  meta: {
    title: "Your Cart",
    description: "Review your North Nectar order. Cash on delivery across Pakistan.",
  },
  drawer: {
    title: "Your cart",
    subtotal: "Subtotal",
    note: "Delivery calculated at checkout. Cash on delivery available.",
    checkout: "Checkout",
    viewCart: "View cart",
    pairsWell: "Pairs well",
    add: "Add",
    emptyTitle: "Your cart is empty",
    emptyText: "Pure goodness from Gilgit-Baltistan is one tap away.",
    shop: "Shop the harvest",
  },
  page: {
    title: "Your cart",
    /** "3 items · Guest checkout, no account needed" */
    subtitle: (count: number) =>
      `${count} ${count === 1 ? "item" : "items"} · Guest checkout, no account needed`,
    columns: { product: "Product", price: "Price", quantity: "Quantity", total: "Total" },
    continueShopping: "← Continue shopping",
    summary: {
      title: "Order summary",
      subtotal: "Subtotal",
      delivery: "Delivery",
      discount: "Discount",
      free: "Free",
      codeLabel: "Discount code",
      codePlaceholder: "Enter code",
      apply: "Apply",
      remove: "Remove",
      invalidCode: "That code isn't valid. Check and try again.",
      appliedCode: (code: string) => `Code ${code} applied.`,
      total: "Total",
      checkout: "Checkout securely",
      whatsapp: "or order on WhatsApp",
    },
    empty: {
      title: "Your cart is empty",
      text: "Looks like you haven't added anything yet. Start with our best sellers from the valleys.",
      shop: "Shop the harvest",
      home: "Back to home",
      popular: "Popular right now",
    },
  },
};
