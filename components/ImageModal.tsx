import { ImageProps } from "./types";


export default function ImageModal({ Key, loc, href }: ImageProps) {
    return (
        <a href={href} className="flex flex-col justify-center items-center w-full md:p-1 p-0 md:rounded-md rounded-sm border border-black hover:border-green-600 transition-all duration-300 hover:scale-105">
            <img src={loc} alt="Image not found" className="w-full aspect-video md:rounded-md rounded-sm" />
        </a>
    );
}