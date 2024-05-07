import React, { useState } from "react";
import { Button, List, Modal } from "antd";
import VirtualList from "rc-virtual-list";
import ImagePreview from "./ImagePreview";

function App() {
  const [files, setFiles] = useState([]);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [modal, contextHolder] = Modal.useModal();

  const handleSelectDirectory = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      setDirectoryHandle(directoryHandle);
      const directoryKey = "dir-cache_" + directoryHandle.name;

      // Attempt to load cached entries from localStorage
      const cachedEntries = localStorage.getItem(directoryKey);
      if (cachedEntries) {
        const parsedEntries = JSON.parse(cachedEntries);
        // Confirm with the user whether to use cached data
        const useCache = await modal.confirm({
          title: "Use Cached Files?",
          content:
            "Previous files are cached. Would you like to use cached data instead of reloading?",
        });

        if (useCache) {
          setFiles(parsedEntries);
          return; // Stop further execution if cache is used
        }
      }

      // If no cache is used, read directory and cache results
      const entries = await readDirectory(directoryHandle);
      entries.sort((a, b) => a.lastModified - b.lastModified);
      setFiles(entries);
      // Cache the new entries in localStorage
      localStorage.setItem(directoryKey, JSON.stringify(entries));
    } catch (error) {
      console.error("Error accessing directory:", error);
    }
  };

  const readDirectory = async (directoryHandle, path = "") => {
    const entries = [];
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file.type.startsWith("image/")) {
          entries.push({
            name: file.name,
            lastModified: file.lastModified,
            type: file.type,
            path: `${path}/${entry.name}`,
          });
        }
      } else if (entry.kind === "directory") {
        const subEntries = await readDirectory(entry, `${path}/${entry.name}`);
        entries.push(...subEntries);
      }
    }
    return entries;
  };

  return (
    <div className="App" style={{ width: 600 }}>
      <Button
        onClick={handleSelectDirectory}
        type="primary"
        style={{ margin: 20 }}
      >
        Select Directory
      </Button>
      <List>
        <VirtualList
          data={files}
          height={400}
          itemHeight={75}
          itemKey="path"
          style={{ width: "100%" }}
        >
          {(item) => (
            <List.Item key={item.path}>
              <List.Item.Meta
                title={new Date(item.lastModified).toLocaleString()}
                description={<pre>{item.path}</pre>}
              />
              <ImagePreview file={item} directoryHandle={directoryHandle} />
            </List.Item>
          )}
        </VirtualList>
      </List>
      {contextHolder}
    </div>
  );
}

export default App;
