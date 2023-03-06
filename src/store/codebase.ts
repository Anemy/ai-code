import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { execa } from 'execa';

import { createTempDir, getFileStructure } from '../ai-code/local-files';
import type { FileDirectory } from '../ai-code/local-files';

export interface CodebaseState {
  directory: string | null;
  githubLink: string | null; // git@github.com:Anemy/gravity.git or https https://github.com/Anemy/gravity.git
  useGithubLink: boolean;
  status: 'initial' | 'loading' | 'loaded';
  fileStructure: null | FileDirectory;
  localTempGitLink: string | null;
  errorMessage: string | null;
}

export const loadCodebase = createAsyncThunk<
  FileDirectory,
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

  console.log('in loadCodebase ', githubLink, directory, useGithubLink);

  if ((useGithubLink && !githubLink) || (!useGithubLink && !directory)) {
    return thunkAPI.rejectWithValue(
      'Please either choose a directory or enter a github link.'
    );
  }

  // if () {
  //   // Github.
  // } else if () {
  //   // Local.
  // }
  // const inputFileNames = await getInputFileNames(options);

  // 1. Ensure the codebase to load exists.
  if (useGithubLink) {
    // TODO: Make sure the url valid.
  } else {
    // Local files.
    // TODO: Ensure we can read them? or do that later when copying.
  }

  // 2. Create temp directory to copy things to.
  const workingDirectory = await createTempDir(`ai-code-${Date.now()}`);

  console.log('created temp workingDirectory', workingDirectory);

  // 3. Copy/clone the codebase into the directory.
  if (useGithubLink) {
    console.log('cloning the ightub repo...');
    const { stdout } = await execa('git', ['clone', githubLink], {
      cwd: workingDirectory,
    });
    console.log('clone stdout', stdout);
  }
  console.log('temp workingDirectory', workingDirectory);

  // 4. Create the directory structure based on the temp dir.
  const fileStructure = getFileStructure({
    inputFolder: workingDirectory,
  });

  // TODO: Check that the resulting file structure is manageable by the ai.
  // if (inputFileNames.length > MAX_INPUT_FILES) {
  //   throw new Error(`Too many input files passed, current max is ${MAX_INPUT_FILES} files.`);
  // }

  return fileStructure;
});

function createInitialState(): CodebaseState {
  return {
    directory: null,
    githubLink: null,
    useGithubLink: false,
    status: 'initial',
    fileStructure: null,
    localTempGitLink: null,
    errorMessage: null,
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
    setStatus: (
      state,
      action: PayloadAction<'initial' | 'loading' | 'loaded'>
    ) => {
      state.status = action.payload;
    },
    setUseGithubLink: (state, action: PayloadAction<boolean>) => {
      state.useGithubLink = action.payload;
    },
    resetCodebase: (
      state,
      action: PayloadAction<'initial' | 'loading' | 'loaded'>
    ) => {
      state = createInitialState();
    },
  },
  extraReducers: {
    [loadCodebase.pending.type]: (state) => {
      state.status = 'loading';
      state.fileStructure = null;
      state.localTempGitLink = null;
      state.errorMessage = null;
    },
    [loadCodebase.fulfilled.type]: (
      state,
      action: PayloadAction<FileDirectory>
    ) => {
      state.status = 'loaded';
      state.fileStructure = action.payload;
      state.localTempGitLink = null; // TODO
      state.errorMessage = null;
    },
    [loadCodebase.rejected.type]: (state, action: PayloadAction<string>) => {
      console.log('rejected loadCodebase', action);
      state.status = 'initial';
      state.fileStructure = null;
      state.localTempGitLink = null;
      state.errorMessage = action.payload
        ? action.payload
        : (action as any)?.error?.message;
    },
  },
});

// Action creators for each case reducer function.
export const {
  setDirectory,
  setGithubLink,
  setStatus,
  resetCodebase,
  setUseGithubLink,
} = codebaseSlice.actions;

const codebaseReducer = codebaseSlice.reducer;
export { codebaseReducer };
