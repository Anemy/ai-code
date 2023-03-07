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

// export async function createTempFile(tempDirId: string) {
//   return await temp.open(tempDirId);
// }

export async function createTempDir(tempDirId: string) {
  return await temp.mkdir(tempDirId);
}

function getMatchPatternArray(matchPatterns?: string[] | string) {
  if (!matchPatterns) {
    return ['**/*.*'];
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

export async function getFileStructure({
  inputFolder,
  matchPatterns,
  ignorePatterns,
}: {
  inputFolder: string; // Path to the input folder.
  matchPatterns?: string[] | string;
  ignorePatterns?: string[] | string;
}): Promise<{
  fileStructure: FileDirectory;
  fileCount: number;
}> {
  try {
    // Ensure we can access the folder.
    await fs.promises.access(inputFolder, fs.promises.constants.R_OK);
  } catch (err) {
    throw new Error(`Cannot access folder "${inputFolder}": ${err}`);
  }

  const matchPatternArray = getMatchPatternArray(matchPatterns);
  console.log('Match patterns:');
  for (const pattern of matchPatternArray) {
    console.log(pattern);
  }

  const fileStructure: FileDirectory = {};
  const uniqueFileNames = new Set<string>();
  for (const pattern of matchPatternArray) {
    // We could parallelize this for large code bases.
    const globbedFiles = await glob(path.join(inputFolder, pattern), {
      ignore: ignorePatterns,
    });

    for (const fileName of globbedFiles) {
      // We remove the input folder so that the ai has less tokens it needs to parse and create.
      const relativeFileName = fileName.substring(inputFolder.length + 1);
      const fileParts = relativeFileName.split('/');
      const lastFileName = fileParts.pop();

      if (lastFileName.startsWith('.')) {
        // Remove . files. (Maybe we'll want this removed later).
        continue;
      }

      uniqueFileNames.add(relativeFileName);

      let relativeFolder = fileStructure;
      for (const part of fileParts) {
        if (!relativeFolder[part]) {
          relativeFolder[part] = {};
        }
        relativeFolder = relativeFolder[part] as FileDirectory;
      }
      relativeFolder[lastFileName] = relativeFileName;
    }
  }

  console.log('\nInput files:');
  console.log(JSON.stringify(fileStructure, null, 2));

  return {
    fileStructure,
    fileCount: uniqueFileNames.size,
  };
}
