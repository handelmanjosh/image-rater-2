import { checkFileExists } from "./aws";
import { ImageProps } from "./types";
import { getFullPath, getImageLoc } from "./utils";


export default async function getInRange(low: number, high: number): Promise<ImageProps[]> {
    const images: ImageProps[] = [];
    for (let i = low; i < high; i++) {
        let key = getImageLoc(i);
        const status = await checkFileExists(key);
        if (status) {
            images.push({
                Key: key,
                href: `/images/image/${i}`,
                loc: getFullPath(key),
            });
        } else {
            break;
        }
    }
    return images;
};