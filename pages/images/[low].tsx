import ImageModal from "@/components/ImageModal";
import Loader from "@/components/Loader";
import getInRange from "@/components/getters";
import { ImageProps } from "@/components/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";



export default function ImagePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [imageProps, setImageProps] = useState<ImageProps[]>([]);
    const [noImages, setNoImages] = useState<boolean>(false);
    useEffect(() => {
        if (router.query) {
            const { low } = router.query;
            if (low !== undefined) {
                getInRange(Number(low), Number(low) + 100).then((imageProps: ImageProps[]) => {
                    console.log(imageProps);
                    if (imageProps.length === 0) {
                        console.log("No images found");
                        setNoImages(true);
                    } else {
                        setImageProps(imageProps);
                        setNoImages(false);
                    }
                    setIsLoading(false);
                });
            }
        }
    }, [router.query]);
    if (isLoading) {
        return (
            <div className="w-screen h-screen">
                <Loader />
            </div>
        );
    } else if (noImages) {
        return (
            <div className="w-full flex justify-center items-center">
                <h1>No images found</h1>
            </div>
        );
    } else {
        return (
            <div className="flex flex-col justify-center items-center gap-2">
                <div className="w-full h-full grid xl:grid-cols-10 lg:grid-cols-8 md:grid-cols-6 grid-cols-4 gap-2 place-items-center items-center p-2">
                    {imageProps.map((imageProp: ImageProps, i: number) => (
                        <ImageModal key={i} {...imageProp} />
                    ))}
                </div>
                <div className="flex flex-row justify-center items-center gap-2">
                    <a href={`/images/${Number(router.query.low) - 100 < 0 ? 0 : Number(router.query.low) - 100}`} className="p-4 rounded-lg bg-green-600 hover:brightness-90 active:brightness-75">Previous</a>
                    <a href={`/images/${Number(router.query.low) + 100}`} className="p-4 rounded-lg bg-green-600 hover:brightness-90 active:brightness-75">Next</a>
                </div>
            </div>
        );
    }
}