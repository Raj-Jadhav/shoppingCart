import { useRouter } from "next/router";
import { register } from "../services/auth";

export default function Register() {
  const router = useRouter();
  const next = router.query.next || "/cart";

  const handleSubmit = async (e) => {
    e.preventDefault();

    await register(
      e.target.username.value,
      e.target.email.value,
      e.target.password.value
    );

    router.push(next);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input name="username" placeholder="Username" />
      <input name="email" placeholder="Email" />
      <input name="password" type="password" />
      <button>Register</button>
    </form>
  );
}
