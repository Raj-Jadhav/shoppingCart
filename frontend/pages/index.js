import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../services/api";
import { addToCart } from "../services/cart";
import { isAuthenticated } from "../services/auth";

export default function Home() {
  const [products, setProducts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    api.get("/products/")
      .then((res) => setProducts(res.data));
  }, []);

  const handleAdd = async (id) => {
    if (!isAuthenticated()) {
      router.push(`/login?next=/cart`);
      return;
    }

    await addToCart(id);
    router.push("/cart");
  };

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>SimpleShop</h2>
        <a href="/login">Login</a>
      </header>

      <h1>Products</h1>

      {products.map((p) => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>UGX {p.price}</p>
          <button onClick={() => handleAdd(p.id)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
