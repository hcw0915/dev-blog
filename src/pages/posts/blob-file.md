---
public: true
layout: ../../layouts/BlogPost.astro
title: Blob & File
createdAt: 1741242140687
updatedAt: 1742357512715
tags:
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: blob-file
---

# Blob & File
![clipboard.png](/posts/blob-file_19.png)
## Blob (binary large object)
本質是一個二進制編碼格式數據, 不可修改, 讀取唯一方法是透過 `FileReader` 

🤔 `new Blob(array, options)` 
- array: 由 `ArrayBuffer`, `ArrayBufferView`, `Blob`, `DOMString` 對象構成
- options: 可以指定屬性.
  - type: 默認為空, 主要表示 MIME 類型
  - [Common MIME types - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types)
  - endings: 默認為 transparent, 不常用 ~

```js
let blob = new Blob(['helloworld'], {type: "text/plain"})

// > Blob {size: 10, type: 'text/plain'}
```

🤔 `slice()`
- 可以透過 `slice()` 做分片
```js
let blobSlice = blob.slice(0, 2, "text/plain")

let reader = new FileReader()
reader.readAsText(blobSlice)

// > FileReader {readyState: 2, result: 'he'..........}
```

---

## File
🤔 File 是特殊類型的 Blob (繼承了 Blob), 也有更多 Blob 沒有的屬性
![clipboard.png](/posts/blob-file_18.png)
 - 可以透過 `<input type="file" />`
 - 透過文件 D&D 操作產生的 `dataTransfer` 
   - `onDrop` `e.dataTransfer.files`

---

## FileReader
```js
const reader = new FileReader()
// reader.readAs****
```

- `readAsArrayBuffer`: 讀取並轉為 `ArrayBuffer`
- `readAsBinaryString`: 讀取並轉為 原始二進制數據
- `readAsDataURL`: 讀取並轉為 `data: URL` 格式的 base64 字符串
 ```js
  const fileInput = document.querySelector('input[type="file"]');
  
  fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  
  if (file) {
    const reader = new FileReader();

    // 當檔案讀取完成後
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      
      // 將讀取的圖片顯示在 <img> 元素中
      const imgElement = document.querySelector('#image-preview');
      imgElement.src = dataUrl;
    };

    // 開始讀取檔案
    reader.readAsDataURL(file);
  }
});
  ```
- `readAsText`: 讀取並轉為文字
```js
reader.readAsText(blob)
reader.result
// 'helloworld'
```

---

## Object URL
`Object URL` 是一種代表本地文件或數據的 URL，它可以讓你在網頁中使用這些本地資源。這些 URL 通常是由瀏覽器生成的，用來引用本地檔案，而不需要先將文件上傳到伺服器。

![clipboard.png](/posts/blob-file_17.png)

```js
// 假設你有一個 <input> 來選擇文件
const fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  
  if (file) {
    // 創建 Object URL
    const objectURL = URL.createObjectURL(file);

    // 顯示圖片
    const imgElement = document.querySelector('#image-preview');
    imgElement.src = objectURL;
  }
});
```

與 `readAsDataURL` 的區別：
- **`readAsDataURL`**：會將文件內容轉換為 Base64 字符串並放入 `src` 屬性。此方法會生成較大的字符串，並會將整個文件內容嵌入到頁面中。
- **`Object URL`**：會生成一個指向文件的臨時 URL，這些 URL 通常會更輕量，不會把文件內容嵌入頁面。它指向本地文件位置，使用 `Object URL` 會佔用記憶體，不需要時，要記得 `URL.revokeObjectURL()` 來釋放。


## Other

- 將 `canvas` 內容轉為 base64 格式
```js
let canvasToDataUrl = canvas.toDataURL()
```

ArrayBuffer 主要可以修改內容或是對二進制文件進行操作. 
> 所以可以透過建立 Buffer 然後透過 blob + FileReader 將二進制數據讀取.
> ![clipboard.png](/posts/blob-file_16.png)
