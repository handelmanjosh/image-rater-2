type Data = {
    locations: number[][][],
    positions: string[][],
    size: [number, number],
};


export function serialize(locations: number[][][], positions: string[][], size: [number, number]): string {
    let obj: Data = {
        positions,
        locations,
        size,
    };
    return JSON.stringify(obj);
}

export function deserialize(data: string): Data {
    let obj = JSON.parse(data);
    return obj as Data;
}