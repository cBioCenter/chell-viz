// ~bb-viz~
// Data Helper
// Helper functions for the more general fetching of data in Bioblocks.
// See DataHelper for the actual transformation of this raw data into Bioblocks objects.
// ~bb-viz~

import { SeqIO, SEQUENCE_FILE_TYPES } from '~bioblocks-viz~/data';

export const fetchCSVFile = async (filename: string) => {
  const response = await fetch(filename);
  if (response.ok) {
    return response.text();
  } else {
    throw new Error(genErrorMsg('CSV', response));
  }
};

export const fetchJSONFile = async (filename: string) => {
  const response = await fetch(filename);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(genErrorMsg('JSON', response));
  }
};

export const fetchFastaFile = async (filename: string) => {
  const response = await fetch(filename);
  if (response.ok) {
    return SeqIO.parseFile(await response.text(), SEQUENCE_FILE_TYPES.fasta);
  } else {
    throw new Error(`error ${response}`);
  }
};

const genErrorMsg = (fileType: string, response: Response) =>
  `Bioblocks-viz error fetching ${fileType} File!\nStatus: ${response.status}\nMessage: ${response.statusText}\n`;

// https://blog.shovonhasan.com/using-promises-with-filereader/
export const readFileAsText = async (inputFile: File) => {
  const temporaryFileReader = new FileReader();

  return new Promise<string>((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject('Problem parsing input file.');
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result as string);
    };
    temporaryFileReader.readAsText(inputFile);
  });
};
