import api from "./api";

export const getCart = () => api.get("/cart/");

export const addToCart = (product_id) =>
  api.post("/cart/add/", { product_id });

export const updateCartItem = (item_id, quantity) =>
  api.patch("/cart/update/", { item_id, quantity });

export const removeCartItem = (item_id) =>
  api.delete("/cart/remove/", { data: { item_id } });

export const checkout = (cash_given) =>
  api.post("/cart/checkout/", { cash_given });
