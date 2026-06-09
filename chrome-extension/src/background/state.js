export const state = {
  email: "",
  googleAccessToken: "",
  isPopupOpen: false,
  row: 0,
  spreadsheetId: "",
  user: null,
};

export function setState(partialState) {
  Object.assign(state, partialState);
}

export function resetUserCache() {
  state.row = 0;
  state.spreadsheetId = "";
  state.user = null;
}
