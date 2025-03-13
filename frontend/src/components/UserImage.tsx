import { useEffect, useState } from "react";
import { Box, Image } from "@chakra-ui/react";
import { DownloadImage } from "@/lib/query.ts";

export function UserImage({
  imageName,
  width,
  height,
  borderRadius,
}: {
  imageName?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}) {
  const [image, setImage] = useState<string>("");

  useEffect(() => {
    if (!imageName) return;
    DownloadImage(imageName).then((data) => {
      setImage(data);
    });
  }, []);

  return (
    <>
      {image ? (
        <Box w={width ?? "500px"} h={height ?? "500px"}>
          <Image
            rounded={borderRadius ?? "md"}
            src={image}
            alt="Image"
            width={"100%"}
            height={"100%"}
            fit={"cover"}
          />
        </Box>
      ) : null}
    </>
  );
}
