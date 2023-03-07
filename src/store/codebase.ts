import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import path from 'path';

import {
  defaultGitFolderName,
  updateFiles,
  cloneAndAnalyzeCodebase,
  getGitDiff,
} from '../ai-code/local-files';
import type { FileDirectory } from '../ai-code/local-files';
import { MAX_INPUT_FILES } from '../ai-code/ai';
import type { PromptState } from './prompt';
import {
  editCodeWithChatGPT,
  editCodeWithIndividualGptRequests,
} from '../ai-code/code-editor';

// Use the chatbot for responses or regular gpt individual api requests.
const useChatbot = true;

type CodebaseStatus =
  | 'initial'
  | 'loading'
  | 'loaded'
  | 'generating-suggestions'
  | 'suggested';

export interface CodebaseState {
  directory: string | null;
  githubLink: string | null; // git@github.com:Anemy/test-project-for-ai-code.git or https https://github.com/Anemy/test-project-for-ai-code.git
  useGithubLink: boolean;
  status: CodebaseStatus;
  fileStructure: null | FileDirectory;
  workingDirectory: string | null;
  errorMessage: string | null;

  diffChanges: string | null; // TODO: not a string.
  descriptionOfChanges: string | null;
}

type LoadCodebaseResult = {
  fileStructure: FileDirectory;
  workingDirectory: string;
};
export const loadCodebase = createAsyncThunk<
  LoadCodebaseResult,
  undefined,
  {
    state: {
      codebase: CodebaseState;
    };
  }
>('codebase/load', async (payload, thunkAPI) => {
  // loadCodebase
  // thunkAPI.
  const {
    codebase: { githubLink, directory, useGithubLink },
  } = thunkAPI.getState();

  if ((useGithubLink && !githubLink) || (!useGithubLink && !directory)) {
    return thunkAPI.rejectWithValue(
      'Please either choose a directory or enter a github link.'
    );
  }

  const { fileCount, fileStructure, workingDirectory } =
    await cloneAndAnalyzeCodebase({
      githubLink,
      useGithubLink,
    });

  // TODO: Check that the resulting file structure is manageable by the ai.
  if (fileCount > MAX_INPUT_FILES) {
    throw new Error(
      `Too many input files passed, current max is ${MAX_INPUT_FILES} files, ${fileCount} found.`
    );
  }

  return {
    fileStructure,
    workingDirectory,
  };
});

type SuggestionsResult = {
  diffChanges: string;
  descriptionOfChanges: string;
};
export const generateSuggestions = createAsyncThunk<
  SuggestionsResult,
  undefined,
  {
    state: {
      codebase: CodebaseState;
      prompt: PromptState;
    };
  }
>('codebase/generate-suggestions', async (payload, thunkAPI) => {
  const {
    prompt: { promptText },
    codebase: { fileStructure, workingDirectory },
  } = thunkAPI.getState();

  console.log('Generating suggestions base on prompt...');

  if (!promptText) {
    return thunkAPI.rejectWithValue('Please enter a prompt to drive changes.');
  }

  // TODO: Clean this up to one for local also.
  const gitFolder = path.join(workingDirectory, defaultGitFolderName);

  if (useChatbot) {
    // 1. Clone, analyze, and get suggested edits.
    const outputFiles = await editCodeWithChatGPT({
      workingDirectory: gitFolder,
      fileStructure,
      promptText,
    });

    // 2. Perform the changes; output to the output.
    await updateFiles({
      workingDirectory: gitFolder,
      outputFiles,
    });
  } else {
    // 1. Clone, analyze, and get suggested edits.
    const outputFiles = await editCodeWithIndividualGptRequests({
      workingDirectory: gitFolder,
      fileStructure,
      promptText,
    });

    // 2. Perform the changes; output to the output.
    await updateFiles({
      workingDirectory: gitFolder,
      outputFiles,
    });
  }

  console.log('Edited files! Now checking the diff...');

  // 3. Get the diff.
  const diffResult = await getGitDiff(gitFolder);
  console.log('git diff result', diffResult);

  return {
    diffChanges: diffResult.stdout,
    descriptionOfChanges: 'TODO',
  };
});

function createInitialState(): CodebaseState {
  return {
    directory: null,
    githubLink: null,
    useGithubLink: false,
    workingDirectory: null,
    status: 'initial',
    fileStructure: null,
    errorMessage: null,

    diffChanges: null,
    descriptionOfChanges: null,
  };
}
const initialState = createInitialState();

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
    setUseGithubLink: (state, action: PayloadAction<boolean>) => {
      state.useGithubLink = action.payload;
    },
    setStatus: (state, action: PayloadAction<CodebaseStatus>) => {
      state.status = action.payload;
    },
  },
  extraReducers: {
    [loadCodebase.pending.type]: (state) => {
      state.status = 'loading';
      state.fileStructure = null;
      state.workingDirectory = null;
      state.errorMessage = null;
    },
    [loadCodebase.fulfilled.type]: (
      state,
      action: PayloadAction<LoadCodebaseResult>
    ) => {
      state.status = 'loaded';
      state.fileStructure = action.payload.fileStructure;
      state.workingDirectory = action.payload.workingDirectory;
      state.errorMessage = null;
    },
    [loadCodebase.rejected.type]: (state, action: PayloadAction<string>) => {
      state.status = 'initial';
      state.fileStructure = null;
      state.workingDirectory = null;
      state.errorMessage = action.payload
        ? action.payload
        : (action as any)?.error?.message;
    },

    [generateSuggestions.pending.type]: (state) => {
      state.status = 'generating-suggestions';
      state.diffChanges = null;
      state.descriptionOfChanges = null;
      state.errorMessage = null;
    },
    [generateSuggestions.fulfilled.type]: (
      state,
      action: PayloadAction<SuggestionsResult>
    ) => {
      state.status = 'suggested';
      state.diffChanges = action.payload.diffChanges;
      state.descriptionOfChanges = action.payload.descriptionOfChanges;
      state.errorMessage = null;
    },
    [generateSuggestions.rejected.type]: (
      state,
      action: PayloadAction<string>
    ) => {
      state.status = 'loaded';
      state.diffChanges = null;
      state.descriptionOfChanges = null;
      state.errorMessage = action.payload
        ? action.payload
        : (action as any)?.error?.message;
    },
  },
});

// Action creators for each case reducer function.
export const { setDirectory, setGithubLink, setUseGithubLink, setStatus } =
  codebaseSlice.actions;

const codebaseReducer = codebaseSlice.reducer;
export { codebaseReducer };
