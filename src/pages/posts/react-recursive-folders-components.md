---
public: true
layout: ../../layouts/BlogPost.astro
title: React recursive folders components
createdAt: 1742278491116
updatedAt: 1742278529517
tags:
  - React
  - Blog
heroImage: /placeholder-hero.png
slug: react-recursive-folders-components
---

# [練習] React recursive folders components

> https://www.youtube.com/watch?v=6UU2Ey4KZr8

- 遞歸式的進行組件建立, 型別與組件相同都是可以被遞歸的使用
- 針對單檔案, 或是不同檔案可以另外做正則解析 給予對應不同的 icons
- 使用較為普遍的 `max-h-[1000px]` 與 `max-h-0` 的變化給予展開時的過渡效果(但還是可以嘗試 `grid` 方法)

```typescript
// 資料結構
const folders: Folder[] = [
  {
    name: "Home",
    folders: [
      {
        name: "Movies",
        folders: [
          {
            name: "Action",
            folders: [
              {
                name: "2000s",
                folders: [
                  { name: "Popular", folders: [] },
                  { name: "classic", folders: [] },
                ],
              },
              { name: "2010s", folders: [] },
            ],
          },
          { name: "Comedy", folders: [{ name: "2000s", folders: [] }] },
        ],
      },
      {
        name: "Music",
        folders: [
          {
            name: "Rock",
            folders: [{ name: "Glasiator.mp4" }, { name: "不具名的悲傷.mp4" }],
          },
          { name: "Classical", folders: [] },
        ],
      },
      { name: "Pictures", folders: [] },
      { name: "Documents", folders: [] },
      { name: "README.md" },
    ],
  },
];

// 型別遞歸
type Folder = {
  name: string;
  folders?: Folder[];
};
```

```typescript
// App.js
export const RecursiveFolders = () => {
  return (
    <div className="p-8 max-w-sm mx-auto">
      <ul>
        {folders.map((folder) => (
          <Folder key={folder.name} folder={folder} />
        ))}
      </ul>
    </div>
  );
};
```

```typescript
import { useState } from "react";
import {
  ChevronRightIcon,
  FolderIcon,
  DocumentIcon,
} from "@heroicons/react/24/solid";

function Folder({ folder }: { folder: Folder }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="my-1.5" key={folder.name}>
      <span className="flex items-center gap-1.5">
        {folder.folders && folder.folders.length > 0 && (
          <button onClick={() => setIsOpen((prev) => !prev)}>
            <ChevronRightIcon
              className={`size-4 text-gray-500 transform transition-transform duration-300 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
        {folder.folders ? (
          <FolderIcon
            className={`size-6 text-sky-500 ${
              folder.folders.length === 0 ? "ml-[22px]" : ""
            }`}
          />
        ) : (
          <DocumentIcon className="size-6 ml-[22px] text-gray-900" />
        )}
        {folder.name}
      </span>
      {folder.folders && folder.folders.length > 0 && (
        <ul
          className={`pl-6 overflow-hidden transition-all duration-500 ease-in-out ${
            isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {folder.folders.map((_folder) => (
            <Folder key={_folder.name} folder={_folder} />
          ))}
        </ul>
      )}
    </li>
  );
}
```