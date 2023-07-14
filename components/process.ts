type Data = {
    locations: number[][][];
    positions: string[][];
    courtLocations: number[][];
    size1: [number, number];
    size2: [number, number];
    type: "outline" | "fill";
};


export function serialize(locations: number[][][], courtLocations: number[][], positions: string[][], size1: [number, number], size2: [number, number], type: "outline" | "fill"): string {
    let obj: Data = {
        positions,
        courtLocations,
        locations,
        size1,
        size2,
        type
    };
    return JSON.stringify(obj);
}

export function deserialize(data: string): Data {
    let obj = JSON.parse(data);
    return obj as Data;
}