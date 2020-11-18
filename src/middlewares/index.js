export * from "./utils";

export const loggingMiddleware = ({ next, store }) => {
  if (store.getters.auth.isLogging) {
    return next({
      name: "",
    });
  }

  return next();
};

export const authMiddleware = ({ next }) => {
  if (!localStorage.getItem("access_token")) {
    return next({
      name: "Login",
    });
  }

  return next();
};
