import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CodebaseState {
  directory: string | null;
  githubLink: string | null;
}

const initialState: CodebaseState = {
  directory: null,
  githubLink: null,
};

export const codebaseSlice = createSlice({
  name: 'codebase',
  initialState,
  reducers: {
    setDirectory: (state, action: PayloadAction<string>) => {
      state.directory = action.payload;
    },
    setGithubLink: (state, action: PayloadAction<string>) => {
      state.githubLink = action.payload;
    },
  },
});

// Action creators for each case reducer function.
export const { setDirectory, setGithubLink } = codebaseSlice.actions;

const codebaseReducer = codebaseSlice.reducer;
export { codebaseReducer };
