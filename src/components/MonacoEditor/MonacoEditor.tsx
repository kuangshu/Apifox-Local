import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { Editor, type EditorProps } from '@monaco-editor/react'
import { merge } from 'lodash-es'

import type { UnsafeAny } from '@/types'
import { deserialize, isPureObject, serialize } from '@/utils'

let monacoEsmLoad: Promise<unknown> | undefined

function loadMonacoEsm() {
  monacoEsmLoad ??= import('./monaco-esm')

  return monacoEsmLoad
}

/**
 * 把 npm 包里的 monaco 装进 loader，并配置好语言服务的 Web Worker。
 *
 * 这里必须经过动态 import：`monaco-esm.ts` 顶层 import 了 `monaco-editor` 和 `?worker`，
 * 只在客户端 chunk 里执行，避免被打进 SSR bundle。
 *
 * loader 要求「配置」早于「init」，而 `<Editor />` 要等自己 mount 的 effect 里才 init，
 * 所以等这里加载完再渲染 `<Editor />` 即可保证顺序。
 */
function useMonacoEsm() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true

    void loadMonacoEsm().then(() => {
      if (alive) {
        setReady(true)
      }
    })

    return () => {
      alive = false
    }
  }, [])

  return ready
}

type EditorMountParams = Parameters<NonNullable<EditorProps['onMount']>>
type EditorInstance = EditorMountParams[0]
type MonacoInstance = EditorMountParams[1]

const defaultEditorOptions: EditorProps['options'] = {
  tabSize: 2,
  minimap: { enabled: false },
  autoIndent: 'full',
}

export interface MonacoEditorProps<ValueType = unknown>
  extends Omit<EditorProps, 'value' | 'onChange' | 'defaultValue'> {
  defaultValue?: ValueType
  value?: ValueType
  onChange?: (value: MonacoEditorProps['value']) => void

  /** 是否在 onChange 事件触发前反序列化字符串。 */
  deserializeOnChange?: boolean
  useDefaultValue?: boolean
}

export interface MonacoEditorRef<ValueType = unknown> {
  editor: EditorInstance | undefined
  monaco: MonacoInstance | undefined
  getDeserializeValue: () => ValueType
}

function EditorX<ValueType = unknown>(
  props: MonacoEditorProps<ValueType>,
  ref: React.Ref<MonacoEditorRef<ValueType>>,
) {
  const {
    defaultValue,
    value = defaultValue,
    onChange,
    deserializeOnChange = true,
    useDefaultValue,
    ...editorProps
  } = props

  const [editorMounted, setEditorMounted] = useState(false)
  const monacoEsmReady = useMonacoEsm()

  const editorRef = useRef<EditorInstance>()
  const monacoRef = useRef<MonacoInstance>()

  useImperativeHandle(
    ref,
    () => {
      return {
        editor: editorRef.current,
        monaco: monacoRef.current,
        getDeserializeValue: () => deserialize(editorRef.current?.getValue()) as ValueType,
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorMounted],
  )

  // 转换 value 为字符串，以便编辑器能正确显示。
  const getEditorValue = (value: UnsafeAny): string | undefined => {
    if (isPureObject(value)) {
      return serialize(value, 2)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value
  }

  const valueObj = useDefaultValue
    ? { defaultValue: getEditorValue(value) }
    : { value: getEditorValue(value) }

  if (!monacoEsmReady) {
    return (
      <div className={editorProps.className} style={{ padding: 12, opacity: 0.6 }}>
        {editorProps.loading ?? '初次加载可能耗时较久，请耐心等待...'}
      </div>
    )
  }

  return (
    <>
      <Editor
        /**
         * 注意：@monaco-editor/react 创建 model 时用的是 `defaultLanguage || language`，
         * 即 defaultLanguage 的优先级更高；而 setModelLanguage 只在 language 变化时才触发，
         * 首次挂载不会执行。所以这里一旦写死 defaultLanguage，外部传的 language 就永远不生效
         * （曾导致 JSON 编辑器按 JavaScript 解析，报 "';' expected.(1005)"）。
         * 只在调用方没指定 language 时才回退到 javascript。
         */
        defaultLanguage={editorProps.language ? undefined : 'javascript'}
        loading="初次加载可能耗时较久，请耐心等待..."
        {...editorProps}
        {...valueObj}
        options={merge(defaultEditorOptions, editorProps.options)}
        onChange={(val) => {
          let changedValue: UnsafeAny

          try {
            changedValue = deserializeOnChange ? deserialize(val) : val
          }
          catch {
            changedValue = val
          }

          onChange?.(changedValue)
        }}
        onMount={(editor, monaco) => {
          editorProps.onMount?.(editor, monaco)
          editorRef.current = editor
          monacoRef.current = monaco
          setEditorMounted(true)
        }}
      />
    </>
  )
}

/**
 * 对 monaco editor 进行简单的封装，使其更容易适配表单受控组件（即 value/onChange 的受控形式）。
 */
export const MonacoEditor = forwardRef(EditorX)
