import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface PromptState {
  prompt: string | null;
}

const initialState: PromptState = {
  prompt: null,
};

export const promptSlice = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    setPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload;
    },
  },
});

export const { setPrompt } = promptSlice.actions;

const promptReducer = promptSlice.reducer;
export { promptReducer };
