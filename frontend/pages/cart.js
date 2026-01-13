import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCart, updateCartItem, removeCartItem, checkout } from "../services/cart";
import { isAuthenticated } from "../services/auth";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [cash, setCash] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?next=/cart");
      return;
    }

    getCart()
      .then(res => setCart(res.data))
      .catch(() => router.push("/login?next=/cart"));
  }, []);

  if (!cart) return <p>Loading...</p>;

  const handleCheckout = async () => {
    try {
      const res = await checkout(Number(cash));
      alert(`Success! Change: UGX ${res.data.change}`);
      router.push("/");
    } catch (err) {
      alert(err.response.data.error);
    }
  };

  return (
    <div>
      <h2>Your Cart</h2>

      {cart.items.map(item => (
        <div key={item.id}>
          <p>{item.product_name}</p>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              updateCartItem(item.id, Number(e.target.value))
                .then(() => getCart().then(res => setCart(res.data)))
            }
          />
          <button onClick={() =>
            removeCartItem(item.id)
              .then(() => getCart().then(res => setCart(res.data)))
          }>
            Remove
          </button>
        </div>
      ))}

      <h3>Total: UGX {cart.total}</h3>

      <input
        placeholder="Cash given"
        value={cash}
        onChange={(e) => setCash(e.target.value)}
      />
      <button onClick={handleCheckout}>
        Checkout
      </button>
    </div>
  );
}
