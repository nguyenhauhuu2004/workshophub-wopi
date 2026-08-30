import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    phone: string,
    displayName: string,
    email: string,
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, phone, displayName, email },
      { withCredentials: true },
    );

    return res.data;
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "auth/signin",
      { username, password },
      { withCredentials: true },
    );
    return res.data; // access token
  },

  googleSignIn: async (credential: string) => {
    const res = await api.post(
      "/auth/google",
      { credential },
      { withCredentials: true },
    );
    return res.data; // { message, accessToken }
  },

  signOut: async () => {
    return api.post("/auth/signout", { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data.accessToken;
  },
};
