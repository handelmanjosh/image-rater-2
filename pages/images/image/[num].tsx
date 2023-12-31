import Loader from "@/components/Loader";
import NextLink from "@/components/NextLink";
import { checkFileExists, getTextData, setNewRecentImage, uploadFile } from "@/components/aws";
import { deserialize, serialize } from "@/components/process";
import { ImageData, ImageProps } from "@/components/types";
import { getFileLoc, getFullPath, getImageLoc } from "@/components/utils";
import { setLazyProp } from "next/dist/server/api-utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const availablePositions: string[] = [
    "O - No Position", "O - Center", "O - Forward", "O - Power Forward", "O - Small Forward", "O - Guard", "O - Shooting Guard", "O - Point Guard",
    "D - No Position", "D - Center", "D - Forward", "D - Power Forward", "D - Small Forward", "D - Guard", "D - Shooting Guard", "D - Point Guard",
];

let canvas: HTMLCanvasElement;
let canvas2: HTMLCanvasElement;
let context2: CanvasRenderingContext2D;
let context: CanvasRenderingContext2D;
let img: HTMLImageElement;
let img2: HTMLImageElement;
let options: { selectedPlayer: number, size: number; } = { selectedPlayer: 0, size: 2 };
// const setStateWorkerFunction = function () {
//     self.onmessage = function (event) {
//         let { setStateLocations, positions, binarySearchAdd } = event.data;
//         setStateLocations = new Function(setStateLocations)();
//         binarySearchAdd = new Function(binarySearchAdd)();
//         setStateLocations((prevLocations: any) => {
//             // Add new positions to the existing ones or create a new subarray
//             let playerLocations = prevLocations[options.selectedPlayer]
//                 ? prevLocations[options.selectedPlayer]
//                 : positions;

//             // Each position needs to be sorted in. We cannot simply append them all.
//             for (const position of positions) {
//                 binarySearchAdd(playerLocations, position);
//             }

//             // Use map to replace the updated player's locations without mutating the others
//             let newLocations = prevLocations.map((locations: any, index: any) =>
//                 index === options.selectedPlayer ? playerLocations : locations
//             );

//             return newLocations;
//         });
//     };
// };

// const workerBlobURL = URL.createObjectURL(new Blob(['(', setStateWorkerFunction.toString(), ')()'], { type: 'application/javascript' }));

export default function SingleImage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [imageExists, setImageExists] = useState<boolean>(false);
    const [imageProps, setImageProps] = useState<ImageProps>({} as ImageProps);
    const [stateLocations, setStateLocations] = useState<number[][][]>([]);
    const [courtLocations, setCourtLocations] = useState<number[][]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<number>(0);
    const [penSize, setPenSize] = useState<number>(2);
    const [players, setPlayers] = useState<ImageData[]>([]);
    const [showPlayers, setShowPlayers] = useState<boolean>(true);
    const [canvasSize1, setCanvasSize1] = useState<[number, number]>([0, 0]);
    const [canvasSize2, setCanvasSize2] = useState<[number, number]>([0, 0]);
    const [transparent, setTransparent] = useState<boolean>(false);
    const [num, setNum] = useState<number>();
    const [type, setType] = useState<"outline" | "fill">("fill");
    // const [worker, setWorker] = useState<Worker>();
    // useEffect(() => {
    //     try {
    //         let worker = new Worker(workerBlobURL);
    //         setWorker(worker);
    //     } catch (e) {

    //     }
    // }, []);
    const mousemove = (event: MouseEvent) => {
        if (canvas) {
            const rect: DOMRect = canvas.getBoundingClientRect();
            const x: number = event.clientX - rect.left - window.scrollX;
            const y: number = event.clientY - rect.top - window.scrollY;
            if (x < canvas.width && x > 0 && y < canvas.height && y > 0) {
                const positions: [number, number][] = [];
                for (let i = - options.size / 2; i < options.size / 2; i++) {
                    for (let j = - options.size / 2; j < options.size / 2; j++) {
                        positions.push([Math.floor(x + i), Math.floor(y + j)]);
                    }
                }
                updatePosition(positions);
            }
        }
    };
    const setCourtLoc = (event: MouseEvent) => {
        if (canvas2) {
            const rect: DOMRect = canvas2.getBoundingClientRect();
            const x: number = event.clientX - rect.left - window.scrollX;
            const y: number = event.clientY - rect.top - window.scrollY;
            if (x < canvas2.width && x > 0 && y < canvas2.height && y > 0) {
                updateCourtPosition([Math.floor(x), Math.floor(y)]);
            }
        }
    };
    const mousedown = () => {
        document.addEventListener("mousemove", mousemove);
    };
    const mouseup = () => {
        document.removeEventListener("mousemove", mousemove);
    };
    useEffect(() => {
        if (!isNaN(Number(router.query.num))) {
            const { num } = router.query;
            setNum(Number(num));
            setNewRecentImage(Number(num));
            let image = getImageLoc(Number(num));
            checkFileExists(image).then((exists: boolean) => {
                if (exists) {
                    let src = getFullPath(image);
                    setImageExists(true);
                    setImageProps({
                        Key: image,
                        href: `/images/image/${num}`,
                        loc: src,
                    });
                    getTextData(getFileLoc(Number(num))).then((data: string) => {
                        let parsedData = deserialize(data);
                        setStateLocations(parsedData.locations || []);
                        setCourtLocations(parsedData.courtLocations || []);
                        setType(parsedData.type || "outline");
                        const players = parsedData.positions.map((position: string[]) => {
                            return {
                                locations: [],
                                positions: position,
                            };
                        });
                        setPlayers(players);
                        setIsLoading(false);
                    });
                } else {
                    setImageExists(false);
                    setIsLoading(false);
                }
            });
        }
    }, [router.query]);
    useEffect(() => {
        if (!isLoading && imageExists) {
            canvas = document.getElementById("canvas") as HTMLCanvasElement;
            canvas2 = document.getElementById("canvas2") as HTMLCanvasElement;
            context = canvas.getContext("2d") as CanvasRenderingContext2D;
            context2 = canvas2.getContext("2d") as CanvasRenderingContext2D;
            if (window.innerWidth < 768) {
                canvas.width = canvas2.width = 200;
            } else if (window.innerWidth < 1024) {
                canvas.width = canvas2.width = 400;
            } else {
                canvas.width = canvas2.width = 600;
            }
            canvas.height = canvas2.height = canvas.width * 9 / 16;
            setCanvasSize1([canvas.width, canvas.height]);
            setCanvasSize2([canvas2.width, canvas2.height]);
            img = document.createElement("img");
            img2 = document.createElement("img");
            img.src = imageProps.loc;
            img2.src = "/court.png";
            img.onload = () => {
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                firstDraw();
            };
            img2.onload = () => {
                context2.drawImage(img2, 0, 0, canvas2.width, canvas.height);
                firstDraw2();
            };
            //context.fillStyle = "black";
            //context.fillRect(0, 0, canvas.width, canvas.height);
            document.addEventListener("mousedown", mousedown);
            document.addEventListener("mouseup", mouseup);
            document.addEventListener("click", setCourtLoc);
            document.addEventListener("keydown", keydown);
        }
        return () => {
            //@ts-ignore
            document.removeEventListener("mousedown", mousedown);
            document.removeEventListener("mouseup", mouseup);
            document.removeEventListener("click", setCourtLoc);
            document.removeEventListener("keydown", keydown);
        };
    }, [imageProps, isLoading, imageExists]);
    const keydown = (event: KeyboardEvent) => {
        if (event.key == "a") {
            document.getElementById("add")?.click();
        } else if (event.key == "h") {
            document.getElementById("hide")?.click();
        } else if (event.key == "t") {
            document.getElementById("transparent")?.click();
        } else if (event.key == "d") {
            document.getElementById("delete")?.click();
        }
    };
    const firstDraw = () => {
        setStateLocations(prevLocations => {
            drawLocations(prevLocations, transparent);
            return prevLocations;
        });
    };
    const firstDraw2 = () => {
        setCourtLocations(prevLocations => {
            drawCourtLocations(prevLocations);
            return prevLocations;
        });
    };
    useEffect(() => {
        if (context && canvas) {
            drawLocations(stateLocations, transparent);
        }
    }, [stateLocations, selectedPlayer, transparent]);
    useEffect(() => {
        if (context2 && canvas2) {
            drawCourtLocations(courtLocations);
        }
    }, [courtLocations, selectedPlayer]);
    const updatePosition = (positions: [number, number][]) => {
        //worker?.postMessage({ setStateLocations: setStateLocations.toString(), positions, binarySearchAdd: binarySearchAdd.toString() });
        setStateLocations(prevLocations => {
            let newLocations = [...prevLocations];
            if (newLocations[options.selectedPlayer]) {
                for (const position of positions) {
                    //todo: speed up. sort array, use binary search to input
                    //newLocations[options.selectedPlayer].push(position);
                    binarySearchAdd(newLocations[options.selectedPlayer], position);
                }
            } else {
                newLocations[options.selectedPlayer] = [];
                for (const position of positions) {
                    //newLocations[options.selectedPlayer].push(position);
                    binarySearchAdd(newLocations[options.selectedPlayer], position);
                }
            }
            return newLocations;
        });
    };
    const updateCourtPosition = (position: number[]) => {
        setCourtLocations((prevCourtLocations: number[][]) => {
            const newLocations = [...prevCourtLocations];
            newLocations[options.selectedPlayer] = position;
            return newLocations;
        });
    };
    const drawCourtLocations = (locations: number[][]) => {
        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.drawImage(img2, 0, 0, canvas2.width, canvas2.height);
        for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            if (locations[i].length === 2) {
                context2.fillStyle = (i == options.selectedPlayer) ? "blue" : "red";
                context2.beginPath();
                context2.arc(location[0], location[1], 5, 0, Math.PI * 2);
                context2.fill();
            }
        }
    };
    const drawLocations = (locations: number[][][], transparent: boolean) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pi2 = 2 * Math.PI;
        for (let i = 0; i < locations.length; i++) {
            for (const coords of locations[i]) {
                context.beginPath();
                context.arc(coords[0], coords[1], 1, 0, pi2);
                if (transparent) {
                    context.fillStyle = (i == options.selectedPlayer) ? "rgba(0, 0, 255, 0.1)" : "rgba(255, 0, 0, 0.1)";
                } else {
                    context.fillStyle = (i == options.selectedPlayer) ? "blue" : "red";
                }
                context.fill();
            }
        }
    };
    const mapAdd = (map: Map<number[], boolean>, val: number[]): undefined => {
        map.set(val, true);
    };
    const binarySearchContains = (arr: number[][], val: number[]): number => {
        let low = 0;
        let high = arr.length - 1;
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (arr[mid][0] === val[0] && arr[mid][1] === val[1]) {
                return -1;
            } else if (arr[mid][0] < val[0] || (arr[mid][0] === val[0] && arr[mid][1] < val[1])) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return low;
    };
    const binarySearchAdd = (arr: number[][], val: number[]): undefined => {
        let index = binarySearchContains(arr, val);
        if (index !== -1) {
            arr.splice(index, 0, val);
        }
    };
    if (isLoading) {
        return (
            <div className="w-screen h-screen">
                <Loader />
            </div>
        );
    } else if (!imageExists) {
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                <h1>Image not found</h1>
                <a href="/" className="p-4 rounded-lg bg-green-600 hover:brightness-90 active:brightness-75">Go back</a>
            </div>
        );
    } else {
        return (
            <div className="relative flex flex-col justify-center items-center h-screen w-screen gap-4">
                <div className="flex flex-row justify-center items-center gap-2">
                    <canvas id="canvas2" />
                    <canvas id="canvas" />
                </div>
                <div className="grid grid-cols-8 gap-2 place-items-center items-center">
                    {availablePositions.map((position: string, i: number) => (
                        <button
                            key={i}
                            className={`py-2 px-4 rounded-lg w-full ${players[selectedPlayer]?.positions.includes(position) ? "bg-red-600" : "bg-green-600"} hover:brightness-90 active:brightness-75`}
                            onClick={() => {
                                const newPlayers = [...players];
                                if (newPlayers[selectedPlayer]) {
                                    if (!newPlayers[selectedPlayer].positions.includes(position)) {
                                        newPlayers[selectedPlayer].positions.push(position);
                                    } else {
                                        newPlayers[selectedPlayer].positions = newPlayers[selectedPlayer].positions.filter((pos: string) => pos !== position);
                                    }
                                } else {
                                    newPlayers[selectedPlayer] = {
                                        locations: [],
                                        positions: [position],
                                    };
                                }
                                setPlayers(newPlayers);
                            }}
                        >
                            {position}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col justify-center items-center gap-2">
                    <input
                        className=""
                        type="range"
                        min="2"
                        max="30"
                        value={penSize}
                        onChange={(event: any) => {
                            setPenSize(event.target.value);
                            options.size = Number(event.target.value);
                        }}
                    />
                    <p>{`Pen Size: ${penSize}`}</p>
                </div>
                <div className="flex flex-row justify-center items-center gap-2">
                    <NextLink href={`/images/image/${Number(router.query.num) - 1}`} text="Previous" />
                    <NextLink href={`/images/${Number(router.query.num)}`} text="Home" />
                    <NextLink href={`/images/image/${Number(router.query.num) + 1}`} text="Next" />
                </div>
                <div className="absolute m-2 top-0 left-0 gap-2 w-auto grid grid-cols-2 place-items-center items-center 2xl:text-base lg:text-sm text-xs">
                    <button
                        className={`${showPlayers ? "bg-red-600" : "bg-green-600"} px-4 w-full py-2 hover:brightness-90 active:brightness-75 rounded-lg`}
                        onClick={() => setShowPlayers(!showPlayers)}
                        id="hide"
                    >
                        {`${showPlayers ? "Hide" : "Show"} Players (h)`}
                    </button>
                    <button
                        className={`${transparent ? "bg-red-600" : "bg-green-600"} px-4 w-full py-2 hover:brightness-90 active:brightness-75 rounded-lg`}
                        onClick={() => setTransparent(!transparent)}
                        id="transparent"
                    >
                        {`Toggle transparency (t)`}
                    </button>
                    <button
                        className="bg-green-600 px-4 py-2 w-full hover:brightness-90 active:brightness-75 rounded-lg"
                        onClick={() => {
                            setPlayers(players => {
                                const newPlayers = [...players];
                                newPlayers.push({
                                    locations: [],
                                    positions: [],
                                });
                                setSelectedPlayer(newPlayers.length - 1);
                                options.selectedPlayer = newPlayers.length - 1;

                                return newPlayers;
                            });
                            setStateLocations(stateLocations => {
                                let newLocations = [...stateLocations];
                                newLocations.push([]);
                                return newLocations;
                            });
                            setCourtLocations(courtLocations => {
                                let newCourtLocations = [...courtLocations];
                                newCourtLocations.push([]);
                                return newCourtLocations;
                            });
                        }}
                        id="add"
                    >
                        {`Add new player (a)`}
                    </button>
                    <button
                        className="bg-yellow-400 px-4 py-2 hover:brightness-90 w-full active:brightness-75 rounded-lg"
                        onClick={() => {
                            let positions = players.map((player: ImageData) => player.positions);
                            const data = serialize(stateLocations, courtLocations, positions, canvasSize1, canvasSize2, type);
                            console.log(num, stateLocations, positions);
                            if (num !== undefined) {
                                setIsLoading(true);
                                uploadFile(getFileLoc(num), data).then(() => {
                                    setIsLoading(false);
                                }).catch(err => {
                                    console.error(err);
                                    setIsLoading(false);
                                });
                            }
                        }}
                    >
                        Save
                    </button>
                    <button
                        className="bg-yellow-400 px-4 py-2 hover:brightness-90 w-full active:brightness-75 rounded-lg"
                        onClick={() => {
                            setType((type: "outline" | "fill") => {
                                return type == "outline" ? "fill" : "outline";
                            });
                        }}
                    >
                        {`Type: ${type}`}
                    </button>
                    <p className="bg-gray-400/60 px-4 py-2 rounded-lg">{`Press (d) to delete selected`}</p>
                </div>
                {showPlayers && players.length > 0 && (
                    <div className="absolute m-2 top-0 right-0 w-auto h-auto max-h-[95%] grid 2xl:grid-cols-2 grid-cols-1 overflow-y-auto gap-2 rounded-lg p-2 bg-slate-600/60 2xl:text-base lg:text-sm text-xs">
                        {players.map((player: ImageData, i: number) => {
                            return (
                                <div key={i} className={`flex flex-col p-1 gap-1 justify-center items-center ${selectedPlayer == i ? "bg-yellow-400" : "bg-gray-400"}  rounded-lg`}>
                                    <div className="flex flex-col justify-center items-center">
                                        {
                                            player.positions.length > 0 ?
                                                player.positions.map((position: string, j: number) => (
                                                    <p className="text-center text-sm" key={j}>{position}</p>
                                                ))
                                                :
                                                <p className="text-center text-sm">No positions set</p>
                                        }
                                    </div>
                                    <div className="flex flex-row justify-center items-center gap-1">

                                        <button
                                            className="bg-yellow-400 py-1 px-2 rounded-lg hover:brightness-90 active:brightness-75 border border-black"
                                            onClick={() => {
                                                options.selectedPlayer = i;
                                                setSelectedPlayer(i);
                                            }}
                                        >
                                            {selectedPlayer == i ? "Selected" : "Select"}
                                        </button>
                                        <button
                                            className="bg-red-400 py-1 px-2 rounded-lg hover:brightness-90 active:brightness-75 border border-black"
                                            onClick={() => {
                                                console.log("reset");
                                                setStateLocations(prevLocations => {
                                                    let newLocations = [...prevLocations];
                                                    newLocations[i] = [];
                                                    return newLocations;
                                                });
                                                setCourtLocations(prevCourtLocations => {
                                                    let newLocations = [...prevCourtLocations];
                                                    newLocations[i] = [];
                                                    return newLocations;
                                                });
                                            }}
                                        >
                                            Reset
                                        </button>
                                        <button
                                            className="bg-red-600 py-1 px-2 rounded-lg hover:brightness-90 active:brightness-75 border border-black"
                                            onClick={() => {
                                                setPlayers(players => {
                                                    let newPlayers = [...players];
                                                    newPlayers.splice(i, 1);
                                                    return newPlayers;
                                                });
                                                setStateLocations(prevLocations => {
                                                    let newLocations = [...prevLocations];
                                                    newLocations.splice(i, 1);
                                                    return newLocations;
                                                });
                                                setCourtLocations(prevCourtLocations => {
                                                    let newLocations = [...prevCourtLocations];
                                                    newLocations.splice(i, 1);
                                                    return newLocations;
                                                });
                                                setSelectedPlayer(0);
                                                options.selectedPlayer = 0;
                                            }}
                                            id={`${selectedPlayer == i ? "delete" : ""}`}
                                        >
                                            {`Delete ${selectedPlayer == i ? "(d)" : ""}`}
                                        </button>
                                    </div>
                                </div>
                            );

                        })}
                    </div>
                )}
            </div>
        );
    }
}
