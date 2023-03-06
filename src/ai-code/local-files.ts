import temp from 'temp';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

// Automatically track and cleanup files at exit.
temp.track();

type FileName = string;

export type FileDirectory = {
  [name: string]: FileDirectory | FileName;
};

export async function createTempDir(tempDirId: string) {
  return await temp.open(tempDirId);
}

const MAX_INPUT_FILES = 5;

function getMatchPatternArray(matchPatterns?: string[] | string) {
  if (!matchPatterns) {
    return ['**/*'];
  } else if (typeof matchPatterns === 'string') {
    return [matchPatterns];
  } else {
    const matchPatternArray: string[] = [];
    for (const pattern of matchPatterns) {
      matchPatternArray.push(pattern);
    }
  }

  return matchPatterns;
}

// export async function getFileNames(options: {
//   inputFolder: string // Path to the input folder.
//   matchPatterns?: string[] | string,
//   ignorePatterns?: string[] | string
// }): Promise<string[]> {
//   try {
//     // Ensure we can access the folder.
//     await fs.promises.access(options.inputFolder, fs.promises.constants.R_OK);
//   } catch (err) {
//     throw new Error(`Cannot access folder "${options.inputFolder}": ${err}`);
//   }

//   const matchPatterns = getMatchPatternArray(options.matchPatterns);
//   console.log('Match patterns:');
//   for (const pattern of matchPatterns) {
//     console.log(pattern);
//   }

//   const inputFileNames = new Set<string>();
//   for (const pattern of matchPatterns) {
//     // We could parallelize this for large code bases.
//     const globbedFiles = await glob(path.join(options.inputFolder, pattern), {
//       ignore: options.ignorePatterns
//     });

//     for (const fileName of globbedFiles) {
//       // We remove the input folder so that the ai has less tokens it needs to parse and create.
//       inputFileNames.add(fileName.substring(options.inputFolder.length + 1));
//     }
//   }

//   console.log('\nInput files:');
//   for (const fileName of inputFileNames) {
//     console.log(fileName);
//   }

//   return Array.from(inputFileNames);
// }

export async function getFileStructure(options: {
  inputFolder: string; // Path to the input folder.
  matchPatterns?: string[] | string;
  ignorePatterns?: string[] | string;
}): Promise<FileDirectory> {
  try {
    // Ensure we can access the folder.
    await fs.promises.access(options.inputFolder, fs.promises.constants.R_OK);
  } catch (err) {
    throw new Error(`Cannot access folder "${options.inputFolder}": ${err}`);
  }

  const matchPatterns = getMatchPatternArray(options.matchPatterns);
  console.log('Match patterns:');
  for (const pattern of matchPatterns) {
    console.log(pattern);
  }

  const folderStructure: FileDirectory = {};
  for (const pattern of matchPatterns) {
    // We could parallelize this for large code bases.
    const globbedFiles = await glob(path.join(options.inputFolder, pattern), {
      ignore: options.ignorePatterns,
    });

    for (const fileName of globbedFiles) {
      // We remove the input folder so that the ai has less tokens it needs to parse and create.
      const relativeFileName = fileName.substring(
        options.inputFolder.length + 1
      );
      const fileParts = relativeFileName.split('/');
      const lastFileName = fileParts.pop();

      let relativeFolder = folderStructure;
      for (const part of fileParts) {
        if (!relativeFolder[part]) {
          relativeFolder[part] = {};
        }
        relativeFolder = relativeFolder[part] as FileDirectory;
      }
      relativeFolder[lastFileName] = lastFileName;
    }
  }

  console.log('\nInput files:');
  console.log(JSON.stringify(folderStructure, null, 2));

  return folderStructure;
}
