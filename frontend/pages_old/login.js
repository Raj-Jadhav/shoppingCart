import { useRouter } from "next/router";
import { login } from "../services/auth";

export default function Login() {
  const router = useRouter();
  const next = router.query.next || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(e.target.username.value, e.target.password.value);
    router.push(next);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Username" />
      <input name="password" type="password" />
      <button>Login</button>
    </form>
  );
}
