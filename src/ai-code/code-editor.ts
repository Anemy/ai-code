import fs from 'fs';
import path from 'path';

import { openai, MAX_FILE_LENGTH_CHARACTERS } from './ai';
import {
  getFileNamesFromFileStructure,
  generateFileMappingPlan,
  createMappingPrompt,
  parseMapping,
} from './file-mapper';
import type { FileMapPlan, RenameOperation } from './file-mapper';
import type { FileDirectory, OutputFile } from './local-files';
import { ChatBot } from './chat-bot';

function createEditPrompt(promptText: string) {
  return `You are doing a coding task, however, you are only performing one part of these instructions.
  You will be given one file's contents as input and then requested to give output.
  The entire task is: "${promptText}"`;
  //   return `Perform the following task on this file: "${promptText}"`;
  //   return promptText;
}

function createChatEditPrompt({
  promptText,
  fileName,
  outputFileName,
  isRenamed,
  fileContents,
}: {
  promptText: string;
  fileName: string;
  outputFileName?: string;
  isRenamed?: boolean;
  fileContents: string;
}) {
  // return `Now we are going file by file and following the mapping from the first question.
  // The entire task is: "${promptText}"
  // The file we're about to edit is named: "${fileName}"
  // Respond with only the updated file contents, NOTHING else.
  // Everything after this line is the file contents:
  // ${fileContents}`;

  return `Now we are going file by file and following the mapping and instructions from the first question.
  The file to edit now is ${
    isRenamed
      ? `going to be renamed from "${fileName}" to "${outputFileName}"`
      : `named: "${fileName}"`
  }.
  Do not contain any extra text in your response, only the file to be outputted.
  Respond with the updated file contents, no other text.
  Everything after this line is the file contents:
  ${fileContents}`;

  // return `Now we are going file by file and following the mapping from the first question.
  // The entire task is: "${promptText}"
  // The file we're about to edit is named: "${fileName}"
  // Respond with only the updated file contents.
  // Do not respond with anything that would not make sense to add to the file.
  // Everything after this line is the file contents:
  // ${fileContents}`;
  //   return `Perform the following task on this file: "${promptText}"`;
  //   return promptText;
}

function createChatDescriptionPrompt() {
  // return `What is a description of the changes made? The mapping from your first reponse was used.`;
  return `Give a summary of the changes made, do not refer to our conversation, only the prompt that was given in the first question.`;
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
  const outputFiles: OutputFile[] = [];

  const inputFileNames = getFileNamesFromFileStructure(fileStructure, '');

  for (const fileName of inputFileNames) {
    console.log(
      'Operate on file',
      fileName,
      'operation:',
      mapping[fileName]?.operation
    );

    const isRenamed = mapping[fileName]?.operation === 'rename';
    const outputFileName = isRenamed
      ? (mapping[fileName] as RenameOperation)?.name || fileName // TODO: Ensure valid name.
      : fileName;

    if (mapping[fileName]?.operation === 'delete') {
      outputFiles.push({
        fileName: outputFileName,
        isDeleted: true,
      });
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

      outputFiles.push({
        fileName: outputFileName,
        text: result.data.choices[0].text || '',
        isRenamed: isRenamed,
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

export async function editCodeWithChatGPT({
  workingDirectory,
  fileStructure,
  promptText,
}: {
  workingDirectory: string;
  promptText: string;
  fileStructure: FileDirectory;
}) {
  // 1. Calculate the high level file mapping to follow later in the code modification.
  const chatBot = new ChatBot();
  const mappingPrompt = createMappingPrompt(promptText, fileStructure);
  const response = await chatBot.startChat(mappingPrompt);
  console.log('chatbot response', response);

  const mapping = parseMapping(response.content);

  const inputFileNames = getFileNamesFromFileStructure(fileStructure, '');

  // 2. Using the mapping and the instructions, create the changes we'll do to the files.

  const outputFiles: OutputFile[] = [];
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
      const isRenamed = mapping[fileName]?.operation === 'rename';
      const outputFileName = isRenamed
        ? (mapping[fileName] as RenameOperation)?.name || fileName // TODO: Ensure valid name.
        : fileName;

      const editFilePrompt = createChatEditPrompt({
        fileName,
        outputFileName,
        isRenamed,
        fileContents: inputFileContents,
        promptText,
      });
      const response = await chatBot.continueChat(editFilePrompt);
      console.log('chatbot response', response);

      // TODO: Factor in multiple choices.

      outputFiles.push({
        fileName: outputFileName,
        text: response.content || '',
        isRenamed,
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
        `Unable to chat edit request using contents from file "${fileName}": ${err}`
      );
    }
  }

  console.log('outputFiles', outputFiles);

  let description: string;
  try {
    const descriptionPrompt = createChatDescriptionPrompt();
    const response = await chatBot.continueChat(descriptionPrompt);
    console.log('chatbot description response', response);

    description = response.content;
  } catch (err: any) {
    if (err?.response) {
      console.error(err.response.status);
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }

    throw new Error(`Unable to get chat description request: ${err}`);
  }

  console.log('chatbot history', chatBot.chatHistory);

  return {
    outputFiles,
    description,
  };
}
