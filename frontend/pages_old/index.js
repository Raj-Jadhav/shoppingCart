import { useEffect, useState } from "react";
import axios from "../services/api";
import { addToCart } from "../services/cart";
import { useRouter } from "next/router";

export default function Home() {
  const [products, setProducts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    axios.get("/products/")
      .then(res => setProducts(res.data));
  }, []);

  const handleAdd = async (productId) => {
    try {
      await addToCart(productId);
      router.push("/cart");
    } catch (err) {
      router.push(`/login?next=/cart`);
    }
  };

  return (
    <div>
      <header>
        <a href="/login" style={{ float: "right" }}>Login</a>
      </header>

      <h1>Shop Items</h1>

      {products.map(p => (
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
