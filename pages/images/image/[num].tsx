import Loader from "@/components/Loader";
import { checkFileExists } from "@/components/aws";
import { ImageData, ImageProps } from "@/components/types";
import { getFileLoc, getFullPath, getImageLoc } from "@/components/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const availablePositions: string[] = [
    "O - Center", "O - Forward", "O - Power Forward", "O - Small Forward", "O - Guard", "O - Shooting Guard", "O - Point Guard",
    "D - Center", "D - Forward", "D - Power Forward", "D - Small Forward", "D - Guard", "D - Shooting Guard", "D - Point Guard",
];
const locations: number[][][] = [];
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let img: HTMLImageElement;
let options: { selectedPlayer: number, size: number; } = { selectedPlayer: 0, size: 2 };
export default function SingleImage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [imageExists, setImageExists] = useState<boolean>(false);
    const [imageProps, setImageProps] = useState<ImageProps>({} as ImageProps);
    const [stateLocations, setStateLocations] = useState<number[][][]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<number>(0);
    const [penSize, setPenSize] = useState<number>(2);
    const [players, setPlayers] = useState<ImageData[]>([]);
    const [showPlayers, setShowPlayers] = useState<boolean>(true);
    useEffect(() => {
        if (!isLoading && imageExists) {
            canvas = document.getElementById("canvas") as HTMLCanvasElement;
            context = canvas.getContext('2d') as CanvasRenderingContext2D;
            img = document.createElement("img");
            if (window.innerWidth < 768) {
                canvas.width = 400;
            } else if (window.innerWidth < 1024) {
                canvas.width = 600;
            } else {
                canvas.width = 800;
            }
            canvas.height = canvas.width * 9 / 16;
            document.addEventListener("mousedown", mousedown);
            document.addEventListener("mouseup", mouseup);
        }
        return () => {
            //@ts-ignore
            canvas = context = img = undefined;
            document.removeEventListener("mousedown", mousedown);
            document.removeEventListener("mouseup", mouseup);
        };
    }, [isLoading, imageExists]);
    const mousemove = (event: MouseEvent) => {
        if (canvas) {
            const rect: DOMRect = canvas.getBoundingClientRect();
            const x: number = event.clientX - rect.left - window.scrollX;
            const y: number = event.clientY - rect.top - window.scrollY;
            const positions: [number, number][] = [];
            for (let i = - options.size / 2; i < options.size / 2; i++) {
                for (let j = - options.size / 2; j < options.size / 2; j++) {
                    positions.push([Math.floor(x + i), Math.floor(y + j)]);
                }
            }
            updatePosition(positions);
        }
    };
    const mousedown = () => {
        document.addEventListener("mousemove", mousemove);
    };
    const mouseup = () => {
        document.removeEventListener("mousemove", mousemove);
    };
    useEffect(() => {
        if (canvas && context && img) {
            img.src = imageProps.loc;
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    }, [imageProps, isLoading, imageExists]);
    useEffect(() => {
        if (router.query.num) {
            const { num } = router.query;
            let image = getImageLoc(Number(num));
            checkFileExists(image).then((exists: boolean) => {
                if (exists) {
                    setImageExists(true);
                    setImageProps({
                        Key: image,
                        href: `/images/image/${num}`,
                        loc: getFullPath(image),
                    });
                } else {
                    setImageExists(false);
                }
                setIsLoading(false);
            });
        }
    }, [router.query]);
    useEffect(() => {
        if (context && canvas) {
            drawLocations(stateLocations);
        }
    }, [stateLocations, selectedPlayer]);
    const updatePosition = (positions: [number, number][]) => {
        setStateLocations(prevLocations => {
            let newLocations = [...prevLocations];
            if (newLocations[options.selectedPlayer]) {
                for (const position of positions) {
                    //todo: speed up. sort array, use binary search to input
                    if (!containsArray(newLocations[options.selectedPlayer], position)) {
                        newLocations[options.selectedPlayer].push(position);
                    }
                }
            } else {
                newLocations[options.selectedPlayer] = [...positions];
            }
            return newLocations;
        });
    };
    const drawLocations = (locations: number[][][]) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        for (let i = 0; i < locations.length; i++) {
            for (const coords of locations[i]) {
                context.beginPath();
                context.arc(coords[0], coords[1], 1, 0, 2 * Math.PI);
                context.fillStyle = (i == options.selectedPlayer) ? "blue" : "red";
                context.fill();
            }
        }
    };
    const containsArray = (arr: number[][], val: number[]): boolean => {
        for (const item of arr) {
            if (item[0] === val[0] && item[1] === val[1]) {
                return true;
            }
        }
        return false;
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
                <canvas id="canvas" />
                <div className="grid grid-cols-7 gap-2 place-items-center items-center">
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
                <div className="absolute m-2 top-0 left-0">
                    <button
                        className={`${showPlayers ? "bg-red-600" : "bg-green-600"} px-4 py-2 hover:brightness-90 active:brightness-75 rounded-lg`}
                        onClick={() => setShowPlayers(!showPlayers)}
                    >
                        {`${showPlayers ? "Hide" : "Show"} Players`}
                    </button>
                    <button
                        className="bg-green-600 px-4 py-2 hover:brightness-90 active:brightness-75 rounded-lg"
                        onClick={() => {
                            setPlayers(players => {
                                const newPlayers = [...players];
                                newPlayers.push({
                                    locations: [],
                                    positions: [],
                                });
                                return newPlayers;
                            });
                        }}
                    >
                        Add new player
                    </button>
                </div>
                {showPlayers && players.length > 0 && (
                    <div className="absolute m-2 top-0 right-0 w-[30%] h-auto max-h-[95%] grid grid-cols-2 overflow-y-auto gap-2 p-2 bg-slate-600/60">
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
                                                newLocations[selectedPlayer] = [];
                                                console.log(newLocations);
                                                return newLocations;
                                            });
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            );

                        })}
                    </div>
                )}
            </div>
        );
    }
}
