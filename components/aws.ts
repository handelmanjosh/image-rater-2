import AWS from 'aws-sdk';
import { GetObjectRequest, HeadObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3';

const s3 = new AWS.S3({
    accessKeyId: "AKIAZB55MEJTS36KNS2U",
    secretAccessKey: "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",
    region: "us-east-1"
});
export async function setNewRecentImage(num: number) {
    await uploadFile('recentImageNum.txt', String(num));
}
export async function uploadFile(key: string, data: string) {
    const params: PutObjectRequest = {
        Bucket: 'timberwolves-data-processing',
        Key: key,
        Body: data,
        ContentType: "text/plain"
    };
    await s3.putObject(params).promise();
}
export async function getRecentImageNum(): Promise<number> {
    try {
        const num = await getTextData('recentImageNum.txt');
        return Number(num);
    } catch (e) {
        return 0;
    }
}
export async function getTextData(key: string): Promise<string> {
    const params: GetObjectRequest = {
        Bucket: 'timberwolves-data-processing',
        Key: key,
    };

    const data = await s3.getObject(params).promise();

    if (!(data.Body instanceof Buffer)) {
        throw new Error("Retrieved data is not a Buffer");
    }

    return data.Body.toString('utf-8');
}
export async function checkFileExists(key: string): Promise<boolean> {
    const params: HeadObjectRequest = {
        Bucket: 'timberwolves-data-processing',
        Key: key,
    };
    try {
        await s3.headObject(params).promise();
        return true;
    } catch (error: any) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}