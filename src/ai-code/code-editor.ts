import fs from 'fs';
import path from 'path';

import { openai, MAX_FILE_LENGTH_CHARACTERS } from './ai';
import {
  getFileNamesFromFileStructure,
  generateFileMappingPlan,
} from './file-mapper';
import type { FileMapPlan, RenameOperation } from './file-mapper';
import type { FileDirectory } from './local-files';

function createEditPrompt(promptText: string) {
  return `You are doing a coding task, however, you are only performing one part of these instructions.
  You will be given one file's contents as input and then requested to give output.
  The entire task is: "${promptText}"`;
}

// Using a mapping and the instructions, create the output files.
async function createEditedFiles({
  fileStructure,
  mapping,
  workingDirectory,
  promptText,
  options,
}: {
  fileStructure: FileDirectory;
  workingDirectory: string;
  mapping: FileMapPlan;
  promptText: string;
  options: {
    temperature?: number;
  };
}) {
  const outputFiles: {
    fileName: string;
    text: string;
    renamed: boolean;
    oldFileName: string | undefined;
  }[] = [];

  const inputFileNames = getFileNamesFromFileStructure(fileStructure, '');

  for (const fileName of inputFileNames) {
    console.log(
      'Operate on file',
      fileName,
      'operation:',
      mapping[fileName]?.operation
    );
    if (mapping[fileName]?.operation === 'delete') {
      // Skip the file if the mapping says it's deleted.
      continue;
    }

    const absoluteFilePath = path.join(workingDirectory, fileName);
    console.log('absoluteFilePath', absoluteFilePath);
    // TODO: How to parallelize but also be able to condense/larger changes?
    const inputFileContents = await fs.promises.readFile(
      absoluteFilePath,
      'utf8'
    );

    if (inputFileContents.length > MAX_FILE_LENGTH_CHARACTERS) {
      throw new Error(
        `Too large of an input file passed, current max is ${MAX_FILE_LENGTH_CHARACTERS} characters. "${fileName}" was "${inputFileContents.length}".`
      );
    }

    // TODO: File renaming/mapping/creation.

    try {
      // https://beta.openai.com/docs/api-reference/edits/create
      const result = await openai.createEdit({
        model: 'text-davinci-edit-001',
        input: inputFileContents,
        // TODO: Fine tune these instructions and somehow weave it together with the whole input.
        // Prompt input/output? QA style
        instruction: createEditPrompt(promptText),

        ...(typeof options.temperature === 'number'
          ? {
              temperature: options.temperature,
            }
          : {}),
        // n: 1 // How many edits to generate for the input and instruction. (Defaults 1).
      });

      // TODO: Factor in multiple choices.

      const isRenamed = mapping[fileName]?.operation === 'rename';

      const outputFileName = isRenamed
        ? (mapping[fileName] as RenameOperation)?.name || fileName // TODO: Ensure valid name.
        : fileName;

      outputFiles.push({
        fileName: outputFileName,
        text: result.data.choices[0].text || '',
        renamed: isRenamed,
        oldFileName: isRenamed ? fileName : undefined,
      });
    } catch (err: any) {
      if (err?.response) {
        console.error(err.response.status);
        console.error(err.response.data);
      } else {
        console.error(err.message);
      }

      throw new Error(
        `Unable to perform openai edit request using contents from file "${fileName}": ${err}`
      );
    }
  }

  console.log('outputFiles', outputFiles);

  return outputFiles;
}

export { createEditedFiles };

export async function editCodeWithIndividualGptRequests({
  workingDirectory,
  fileStructure,
  promptText,
}: {
  workingDirectory: string;
  promptText: string;
  fileStructure: FileDirectory;
}) {
  // 1. Calculate the high level file mapping to follow later in the code modification.
  const mapping = await generateFileMappingPlan(promptText, fileStructure);

  // TODO: Check that the file structure is manageable by the ai before starting.

  // 2. Using the mapping and the instructions, create the changes we'll do to the files.
  const outputFiles = await createEditedFiles({
    fileStructure,
    promptText,
    workingDirectory,
    mapping,
    options: {},
  });

  return outputFiles;
}
