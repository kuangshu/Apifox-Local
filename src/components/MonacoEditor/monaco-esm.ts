/*
 * `?worker` 是 Vite/webpack 的 worker 导入语法，TS 通过 vite/client 的声明认识它，
 * 但 eslint-plugin-import 自己的解析器不认识，会误报 import/default。
 */
/* eslint-disable import/default */
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

/**
 * monaco 的语言服务（JSON 校验、HTML/CSS/TS 补全等）跑在 Web Worker 里，
 * 浏览器不会自己去 node_modules 找这些脚本，必须显式告诉 monaco 用哪个 worker。
 * `?worker` 后缀是 Vite/webpack 的语法，会把 worker 单独打包成 chunk。
 */
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }

    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }

    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }

    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }

    return new editorWorker()
  },
}

/**
 * 把 npm 包里的 monaco 实例注入 loader，彻底不走 CDN。
 * 这是官方文档给出的用法（@monaco-editor/react v4.4.0+）。
 */
loader.config({ monaco })
