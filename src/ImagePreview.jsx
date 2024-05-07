import React, { useState, useEffect } from "react";
import { Image } from "antd";

const ImagePreview = ({ file, directoryHandle }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPreview = async () => {
      try {
        if (directoryHandle && file.type.startsWith("image/")) {
          // Split the path and remove the last part as it's the file name
          const pathSegments = file.path.split("/").filter(Boolean);
          const fileName = pathSegments.pop(); // Remove and save the last segment as file name
          let currentHandle = directoryHandle;

          // Iterate over the remaining segments to get to the directory containing the file
          for (const segment of pathSegments) {
            console.log(currentHandle, segment);
            currentHandle = await currentHandle.getDirectoryHandle(segment);
          }
          console.log(currentHandle, fileName);
          // Now get the file handle from the final directory handle
          const fileHandle = await currentHandle.getFileHandle(fileName, {
            create: false,
          });
          const fileData = await fileHandle.getFile();
          const url = URL.createObjectURL(fileData);
          if (isMounted) {
            setPreviewUrl(url);
          }
        }
      } catch (error) {
        console.error("Error loading image preview:", error);
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, directoryHandle]);

  return (
    <Image
      width={100}
      src={previewUrl}
      alt={`Preview of ${file.name}`}
      fallback="Image cannot be displayed"
    />
  );
};

export default ImagePreview;
