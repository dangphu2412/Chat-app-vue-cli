const state = {
  user: {
    isLogging: false
  }
};

const getters = {
  auth(state) {
    return state.user;
  }
};

export const AuthStore = {
  state,
  getters
};
