/**
 * 把一組檔案組成可直接塞進 iframe srcdoc 的預覽文件。
 *
 * 入口永遠是 index.html —— 跟 CodeSandbox 一樣，HTML 是真的 HTML，不是「把 body
 * 抽出來再拼」。本地引用一律內聯：
 *   <link rel="stylesheet" href="style.css">    → <style>
 *   <script src="index.js">                     → <script>（傳統腳本）
 *   <script type="module" src="src/main.jsx">   → 交給 iframe 內的迷你模組系統
 *
 * 模組系統（MODULE_RUNTIME）用 Babel standalone 把每個檔案轉成 CommonJS，再用一個
 * 幾十行的 require() 解析相對路徑；外部套件先從 esm.sh 動態載入再注入。
 * 這就是 vanilla 與 React 共用同一條管線的原因：差別只在資料夾裡有什麼檔案。
 */

export type FileMap = Record<string, string>

const norm = (p: string) => p.replace(/^\.?\//, "")
const isRemote = (p: string) => /^(https?:)?\/\//.test(p) || p.startsWith("data:")

/** iframe 內把 console.* 與未捕捉錯誤橋回父頁 */
const CONSOLE_BRIDGE = `(function(){
  var fmt=function(a){try{
    if(a instanceof Error)return a.stack||String(a);
    if(typeof a==='string')return a;
    if(a&&a.nodeType===1)return a.outerHTML.slice(0,200);
    return JSON.stringify(a,null,1)
  }catch(e){return String(a)}};
  var send=function(level,args){try{parent.postMessage({__sandbox:true,level:level,args:Array.prototype.map.call(args,fmt)},'*')}catch(e){}};
  ['log','info','warn','error','debug'].forEach(function(l){
    var o=console[l]?console[l].bind(console):function(){};
    console[l]=function(){o.apply(null,arguments);send(l,arguments)}
  });
  window.addEventListener('error',function(e){send('error',[e.message+(e.filename?' ('+e.filename.replace(/^.*\\//,'')+':'+e.lineno+')':'')])});
  window.addEventListener('unhandledrejection',function(e){send('error',[String(e.reason&&e.reason.stack||e.reason)])});
})();`

// 固定 React 18：esm.sh 對 react / react-dom / jsx-runtime 才會解析到同一個實例
const PINS: Record<string, string> = {
  react: "react@18",
  "react/jsx-runtime": "react@18/jsx-runtime",
  "react/jsx-dev-runtime": "react@18/jsx-dev-runtime",
  "react-dom": "react-dom@18",
  "react-dom/client": "react-dom@18/client"
}

/**
 * 把 JSON 安全地塞進 <script>：files 裡的 index.html 含有字面上的 </script>，
 * JSON.stringify 不會轉義 "/"，會提早關掉 runtime 的 <script> 標籤。
 */
const jsonForScript = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, "\\u003c") // 同時擋掉 </script> 與 <!--，且 JSON / JS 都合法
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")

const MODULE_RUNTIME = (files: FileMap) => `
window.__files=${jsonForScript(files)};
window.__pins=${jsonForScript(PINS)};
window.__sandbox_run=async function(entry){
  var files=window.__files, pins=window.__pins;
  var EXTS=['','.js','.jsx','.ts','.tsx','.mjs','.json','.css','/index.js','/index.jsx','/index.ts','/index.tsx'];
  var isLocal=function(s){return s.charAt(0)==='.'||s.charAt(0)==='/'};
  var resolve=function(from,spec){
    var base=spec.charAt(0)==='/'?[]:from.split('/').slice(0,-1);
    spec.replace(/^\\//,'').split('/').forEach(function(p){ if(p==='.'||p==='')return; if(p==='..')base.pop(); else base.push(p) });
    var joined=base.join('/');
    for(var i=0;i<EXTS.length;i++){ if(files[joined+EXTS[i]]!==undefined) return joined+EXTS[i] }
    throw new Error("Cannot find module '"+spec+"' imported from '"+from+"'");
  };
  // 先掃出所有外部套件，一次載完再執行，require() 才能維持同步
  var externals={};
  var re=/(?:import|export)\\s[^'"]*?from\\s*['"]([^'"]+)['"]|import\\s*['"]([^'"]+)['"]|require\\(\\s*['"]([^'"]+)['"]\\s*\\)/g;
  var anyJsx=false;
  Object.keys(files).forEach(function(p){
    if(!/\\.(m?jsx?|tsx?)$/.test(p))return;
    if(/\\.(jsx|tsx)$/.test(p))anyJsx=true;
    var m; re.lastIndex=0;
    while((m=re.exec(files[p]))){ var s=m[1]||m[2]||m[3]; if(s&&!isLocal(s))externals[s]=1 }
  });
  if(anyJsx){externals['react']=1;externals['react/jsx-runtime']=1}
  var mods={};
  await Promise.all(Object.keys(externals).map(function(s){
    var url='https://esm.sh/'+(pins[s]||s);
    return import(url).then(function(m){mods[s]=m}).catch(function(e){throw new Error('Failed to load "'+s+'" from esm.sh: '+e.message)});
  }));
  var cache={};
  var load=function(path){
    if(cache[path])return cache[path].exports;
    var src=files[path];
    var mod={exports:{}}; cache[path]=mod;
    if(/\\.css$/.test(path)){ var st=document.createElement('style'); st.setAttribute('data-src',path); st.textContent=src; document.head.appendChild(st); return mod.exports }
    if(/\\.json$/.test(path)){ mod.exports=JSON.parse(src); return mod.exports }
    // 不是 js/ts/css/json 的一律當純文字模組（像 Vite 的 ?raw）：shader、markdown 都能 import
    if(!/\\.(m?jsx?|tsx?)$/.test(path)){ mod.exports={__esModule:true,default:src}; return mod.exports }
    var isTS=/\\.tsx?$/.test(path);
    var presets=[['env',{modules:'commonjs',targets:{esmodules:true}}],['react',{runtime:'automatic'}]];
    if(isTS)presets.push(['typescript',{isTSX:/\\.tsx$/.test(path),allExtensions:true}]);
    var out=Babel.transform(src,{filename:path,presets:presets,sourceType:'module'}).code;
    var req=function(spec){
      if(isLocal(spec))return load(resolve(path,spec));
      if(!mods[spec])throw new Error('Module not loaded: '+spec);
      return mods[spec];
    };
    new Function('require','module','exports',out)(req,mod,mod.exports);
    return mod.exports;
  };
  try{ load(entry) }catch(e){ console.error(e) }
};`

export interface BuildOptions {
  /** 入口，預設 index.html */
  entry?: string
}

export function buildPreview(files: FileMap, opts: BuildOptions = {}): string {
  const entry = opts.entry ?? "index.html"
  let html = files[entry]
  if (html === undefined) {
    return `<!doctype html><body style="font-family:system-ui;padding:24px;color:#888">No <code>${entry}</code></body>`
  }

  let needsRuntime = false

  // <link rel="stylesheet" href="local.css"> → <style>
  html = html.replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, (tag, href) => {
    if (isRemote(href) || !/rel=["']?stylesheet/i.test(tag)) return tag
    const css = files[norm(href)]
    return css === undefined ? tag : `<style data-src="${href}">\n${css}\n</style>`
  })

  // <script src="local">：傳統腳本內聯；module 腳本交給 runtime
  html = html.replace(
    /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (tag, pre, src, post) => {
      if (isRemote(src)) return tag
      const path = norm(src)
      if (/type=["']module["']/i.test(pre + post)) {
        needsRuntime = true
        return `<script>__sandbox_run(${JSON.stringify(path)})</script>`
      }
      const js = files[path]
      return js === undefined ? tag : `<script data-src="${src}">\n${js}\n</script>`
    }
  )

  // 行內 <script type="module"> 也走 runtime（當成虛擬檔案）
  let inlineIdx = 0
  html = html.replace(
    /<script\b([^>]*)\btype=["']module["']([^>]*)>([\s\S]*?)<\/script>/gi,
    (tag, pre, post, body) => {
      if (/\bsrc=/.test(pre + post)) return tag
      needsRuntime = true
      const vpath = `__inline_${inlineIdx++}.jsx`
      files = { ...files, [vpath]: body }
      return `<script>__sandbox_run(${JSON.stringify(vpath)})</script>`
    }
  )

  const head =
    `<script>${CONSOLE_BRIDGE}</script>` +
    (needsRuntime
      ? `<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script><script>${MODULE_RUNTIME(files)}</script>`
      : "")

  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, m => m + head)
    : head + html
}

/** 依副檔名決定 Monaco 語言 */
export const languageOf = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase() ?? ""
  return (
    {
      html: "html",
      htm: "html",
      css: "css",
      scss: "scss",
      js: "javascript",
      mjs: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      md: "markdown",
      svg: "xml",
      glsl: "cpp",
      frag: "cpp",
      vert: "cpp"
    }[ext] ?? "plaintext"
  )
}
