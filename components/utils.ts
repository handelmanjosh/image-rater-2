export const getImageLoc = (num: number): string => `images/${num}.png`;
export const getFileLoc = (num: number): string => `files/${num}.txt`;
export const getFullPath = (s: string) => `https://s3.amazonaws.com/timberwolves-data-processing/${s}`;