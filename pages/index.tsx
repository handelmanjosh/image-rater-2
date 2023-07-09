import Loader from "@/components/Loader";
import { getRecentImageNum } from "@/components/aws";
import { useEffect, useState } from "react";

export default function Home() {
  const [recentImageNum, setRecentImageNum] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getRecentImageNum().then((num: number) => {
      setRecentImageNum(num);
      setIsLoading(false);
    });
  }, []);
  if (isLoading) {
    return (
      <div className="w-screen h-screen">
        <Loader />
      </div>
    );
  } else {
    return (
      <div className="flex flex-col justify-center items-center gap-2 w-full mt-10">
        <div className="flex flex-row justify-center items-center gap-2">
          <a href={`/images/image/${recentImageNum}`} className="p-4 rounded-lg bg-green-600 hover:brightness-90 active:brightness-75">Go to recent image</a>
          <a href={`/images/${recentImageNum}`} className="p-4 rounded-lg bg-green-600 hover:brightness-90 active:brightness-75">Go to recent image page</a>
        </div>
        <p>{`Recent image: ${recentImageNum}`}</p>
      </div>
    );
  }
}
