


export function serialize(locations: number[][][], positions: string[][]): string {
    let obj = {
        positions,
        locations,
    };
    return JSON.stringify(obj);
}

export function deserialize(data: string) {
    let obj = JSON.parse(data);
    return obj;
}