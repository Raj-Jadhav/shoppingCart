import api from "./api";

export const login = async (username, password) => {
  const res = await api.post("/auth/login/", {
    username,
    password,
  });

  localStorage.setItem("access", res.data.tokens.access);
  localStorage.setItem("refresh", res.data.tokens.refresh);
};

export const register = async (username, email, password) => {
  const res = await api.post("/auth/register/", {
    username,
    email,
    password,
  });

  localStorage.setItem("access", res.data.tokens.access);
  localStorage.setItem("refresh", res.data.tokens.refresh);
};

export const logout = () => {
  localStorage.clear();
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("access");
};
