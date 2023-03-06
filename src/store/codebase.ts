import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { execa } from 'execa';
import path from 'path';

import { createTempDir, getFileStructure } from '../ai-code/local-files';
import type { FileDirectory } from '../ai-code/local-files';
import { MAX_INPUT_FILES } from '../ai-code/ai';
import type { PromptState } from './prompt';
import { generateFileMappingPlan } from '../ai-code/file-mapper';
import { createEditedFiles } from '../ai-code/code-editor';

type CodebaseStatus =
  | 'initial'
  | 'loading'
  | 'loaded'
  | 'generating-suggestions'
  | 'suggested';

export interface CodebaseState {
  directory: string | null;
  githubLink: string | null; // git@github.com:Anemy/gravity.git or https https://github.com/Anemy/gravity.git
  useGithubLink: boolean;
  status: CodebaseStatus;
  fileStructure: null | FileDirectory;
  workingDirectory: string | null;
  errorMessage: string | null;

  diffChanges: string | null; // TODO: not a string.
  descriptionOfChanges: string | null;
}

const defaultGitFolderName = 'project';

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

  // 1. Ensure the codebase to load exists.
  if (useGithubLink) {
    // TODO: Make sure the url valid.
  } else {
    // Local files.
    // TODO: Ensure we can read them? or do that later when copying.
  }

  const operationId = `ai-code-${Date.now()}`; // TODO: uuid or something.

  // 2. Create temp directory to copy things to.
  const workingDirectory = await createTempDir(operationId);

  console.log('Created temp workingDirectory: ', workingDirectory);

  // 3. Copy/clone the codebase into the directory.
  if (useGithubLink) {
    console.log('Cloning the github repo...');
    const { stdout } = await execa(
      'git',
      ['clone', githubLink, defaultGitFolderName],
      {
        cwd: workingDirectory,
      }
    );

    const gitFolder = path.join(workingDirectory, defaultGitFolderName);

    console.log('git clone stdout', stdout);
    const { stdout: checkoutBranchStdout } = await execa(
      'git',
      ['checkout', '-b', operationId],
      {
        cwd: gitFolder,
      }
    );
    console.log('git checkout new branch (-b) stdout', checkoutBranchStdout);
  } else {
    // TODO: Initiate github repo (if it isn't one already?)
    // Checkout a branch
  }

  console.log('Analyzing file structure...');

  // 4. Analyze the directory/file structure.
  const { fileStructure, fileCount } = await getFileStructure({
    inputFolder: workingDirectory,
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

  // TODO: One source of truth.
  const gitFolder = path.join(workingDirectory, defaultGitFolderName);

  // 1. Calculate the high level file mapping to follow later in the code modification.
  const mapping = await generateFileMappingPlan(promptText, fileStructure);

  // TODO: Check that the file structure is manageable by the ai before starting.

  console.log('Created mapping:', JSON.stringify(mapping, null, 2));

  // 2. Using the mapping and the instructions, perform the changes.
  await createEditedFiles({
    fileStructure,
    promptText,
    workingDirectory: gitFolder,
    mapping,
    options: {},
  });

  console.log('Edited files! Now checking the diff...');

  const { stdout: gitDiffStdout } = await execa(
    'git',
    ['diff'], // --raw ? https://git-scm.com/docs/git-diff
    {
      cwd: gitFolder,
    }
  );
  console.log('gitDiffStdout', gitDiffStdout);

  return {
    diffChanges: gitDiffStdout,
    descriptionOfChanges: 'These are the proposed changes',
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
    resetCodebase: (state) => {
      // TODO: Better state reset. This is bugged
      state = createInitialState();
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
export const { setDirectory, setGithubLink, resetCodebase, setUseGithubLink } =
  codebaseSlice.actions;

const codebaseReducer = codebaseSlice.reducer;
export { codebaseReducer };
