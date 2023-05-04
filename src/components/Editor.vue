<template>
  <div class="relative">
    <div v-if="loading" id="loading"/>

    <!-- <div id="header">
      <h1>AssemblyScript Editor</h1>
      <p><a href="introduction.html" target="_blank" rel="noopener">Language documentation</a></p>
    </div> -->

    <div id="buttons">
      <a class="button options" title="Compiler Options" v-if="contract_wasm.length" @click="downloadWasm">💾 WASM</a>
      <a class="button options" title="Compiler Options" v-if="contract_wasm.length" @click="downloadAbi">💾 ABI</a>
    </div>

    <div id="clipboard" class="popup">
      Shareable link copied to clipboard.
    </div>

    <div id="tabs">
      <a id="sourceTab" class="tab source active" title="AssemblyScript source code">contract.ts</a>
      <a id="binaryTab" class="tab binary" title="Click to Compile">contract.wat</a>
      <a id="abiTab" class="tab abi" title="ABI">contract.abi</a>
      <a id="htmlTab" class="tab html" title="JavaScript host code">test.html</a>
      <a id="playTab" class="tab play" title="Click to Compile & Run">Run Tests</a>
    </div>

    <div id="panes">
      <div id="source" ref="sourcePane" class="pane source active" aria-labelledby="sourceTab"></div>
      <div id="binary" ref="binaryPane" class="pane binary" aria-labelledby="binaryTab"></div>
      <div id="abi" ref="abiPane" class="pane abi" aria-labelledby="abiTab"></div>
      <div id="html" ref="htmlPane" class="pane html" aria-labelledby="htmlTab"></div>
      <div id="play" class="pane play" aria-labelledby="htmlTab">
        <iframe
          id="play-frame"
          title="Play frame"
          src="data:text/html;base64,"
          sandbox="allow-scripts allow-pointer-lock"
          ref="playFrame"
        ></iframe>
      </div>
    </div>

    <input type="text" id="clipboardHelper" aria-hidden="true" />

    <MonacoEditor
      class="editor"
      v-model="code"
      :value="code"
      @editorDidMount="editorDidMount"
      ref="editor"
    />
  </div>
</template>

<script lang="ts">
import { h, defineComponent, onMounted, ref } from 'vue'
import MonacoEditor from 'vue-monaco'
import theme from '../theme/theme.json'
import { config as watLanguageConfig, tokens as watLanguageTokens } from '../theme/wat'
import contractSources from '../files/contractSources'
import * as F from '../files/contractSources'
import defaultContract from '../files/defaultContract.ts.txt?assembly'
import defaultTest from '../files/defaultTest.ts.txt?assembly'
import process from "process"
import { useStorage } from '@vueuse/core'

import asc from "assemblyscript/asc";
import { ContractTransform } from "./transform";
import { APIOptionImpl } from './ascoption'

MonacoEditor.render = () => h('div')

let contractEditor = undefined as any
let binaryEditor = undefined as any
let abiEditor = undefined as any
let htmlEditor = undefined as any

export default defineComponent({
  name: 'editor-view',
  components: {
    MonacoEditor
  },

  setup () {
    const code = useStorage('code', '')
    const loading = ref(true)
    const editor = ref(undefined)
    const playFrame = ref(undefined)
    const sourcePane = ref(undefined)
    const binaryPane = ref(undefined)
    const htmlPane = ref(undefined)
    const abiPane = ref(undefined)
    
      // Options
    const contract_wat = ref('(module)\n')
    const contract_wasm = ref([])
    const contract_js = ref('\n')
    const didCompile = ref(false)

    function download(filename, body, extension) {
      const blob = new Blob([body])
      const fileName = `${filename}.${extension}`
      if ((navigator as any).msSaveBlob) {
        // IE 10+
        // TODO remove IE implementation as  outdated
        ;(navigator as any).msSaveBlob(blob, fileName)
      } else {
        const link = document.createElement('a')
        // Browsers that support HTML5 download attribute
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', fileName)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
    }

    function downloadWasm () {
      download(`contract`, contract_wasm.value, 'wasm')
    }

    function downloadAbi () {
      download(`contract`, abiEditor.getValue(), 'abi')
    }

    async function editorDidMount() {
      const monaco = editor.value.monaco

      // Add WebAssembly Text Format language
      monaco.languages.register({ id: 'wat' })
      monaco.languages.setLanguageConfiguration('wat', watLanguageConfig)
      monaco.languages.setMonarchTokensProvider('wat', watLanguageTokens)

      // Extend the default theme with WebAssembly rules
      monaco.editor.defineTheme('vs-wasm', theme)

      // Add AssemblyScript Standard Library definition
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        allowSyntheticDefaultImports: true,
        // noEmit: true,
        esModuleInterop: true,
        experimentalDecorators: true,
      });

      monaco.languages.typescript.typescriptDefaults.addExtraLib(asc.definitionFiles.assembly, "assemblyscript/std/assembly/index.d.ts")
      monaco.languages.typescript.typescriptDefaults.addExtraLib(F.protonTscTypes.default, "proton-tsc/index.d.ts");

      // Common editor options
      const commonEditorOptions = {
        value: '',
        theme: 'vs-wasm',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        fontSize: 16,
        // fontFamily: MONACO_EDITOR_FONT,
        fontLigatures: true,
        padding: {
          bottom: 18,
          top: 18
        },
        scrollbar: {
          alwaysConsumeMouseWheel: false
        },
        minimap: {
          enabled: false
        },
        matchBrackets: 'near',
        renderLineHighlight: 'none',
        cursorStyle: 'line-thin',
        cursorBlinking: 'smooth'
      }

      // Create editor panes
      const contractModel = monaco.editor.createModel(defaultContract, 'typescript')
      contractEditor = monaco.editor.create(sourcePane.value, Object.assign({}, commonEditorOptions, {
        model: contractModel,
      }))

      const binaryModel = monaco.editor.createModel('(module\n 🚀\n)\n', 'wat')
      binaryModel.updateOptions({ tabSize: 1 })
      binaryEditor = monaco.editor.create(binaryPane.value, Object.assign({}, commonEditorOptions, {
        model: binaryModel,
        readOnly: true
      }))

      const htmlModel = monaco.editor.createModel('', 'html')
      htmlEditor = monaco.editor.create(htmlPane.value, Object.assign({}, commonEditorOptions, {
        model: htmlModel
      }))

      const abiModel = monaco.editor.createModel('', 'html')
      abiEditor = monaco.editor.create(abiPane.value, Object.assign({}, commonEditorOptions, {
        model: abiModel
      }))

      // Make tabs switchable
      for (const element of document.querySelectorAll('.tab')) {
        element.addEventListener('click', async () => {
          document.querySelectorAll('.tab').forEach(element => element.classList.remove('active'))
          element.classList.add('active')
          document.querySelectorAll('.pane').forEach(element => element.classList.remove('active'))
          const pane = document.getElementById(element.id.substring(0, element.id.length - 3))
          pane!.classList.add('active')
          if (element.id == 'binaryTab') {
            binaryEditor.setValue('(module\n 🚀\n)\n')
            setTimeout(() => compile(), 10)
          } else if (element.id == 'htmlTab') {
            if (!didCompile.value) {
              await compile()
            }

            if (!htmlEditor.getValue()) {
              htmlEditor.setValue(defaultTest);
            }
          } else if (element.id == 'playTab') {
            if (!htmlEditor.getValue()) {
              htmlEditor.setValue(defaultTest);
            }

            playFrame.value.src = 'data:text/html;base64,' + btoa(
              htmlEditor
                .getValue()
                .replace('INJECT_ABI', JSON.stringify(JSON.parse(abiEditor.getValue())))
                .replace('INJECT_WASM', 'new Uint8Array([' + contract_wasm.value.join(',') + '])')
            );
          }
        })
      }

      // Finally, hide the loading animation
      loading.value = false
    }

    // Compiles the source to WebAssembly
    async function compile() {
      const sources: any = {
        'contract.ts': contractEditor.getValue(),
        ...contractSources
      }

      // Reset process
      process.sourceModifier = undefined

      // Create mem
      const memoryStream = asc.createMemoryStream()

      // Create options
      const outputs: any = {}
      const options = [
        'contract.ts',
        '--initialMemory', '1',
        '--runtime', 'stub',
        '--use', 'abort= ',
        '--disable', 'mutable-globals',
        '--disable', 'sign-extension',
        '--disable', 'nontrapping-f2i',
        '--disable', 'bulk-memory',
        '-O2'
      ]
    
      const apiOptions = new APIOptionImpl(sources, {
        stdout: memoryStream,
        stderr: memoryStream,
        writeFile: (name: string, contents: string) => { outputs[name] = contents },
        listFiles: () => [],
        transforms: [new ContractTransform(abiEditor)]
      });

      const { error: initError, stderr } = await asc.main(options, apiOptions);
      if (initError) {
        alert(`
          ${initError}
          ${stderr.toString()}
        `)
        return
      }

      // Remove Transforms
      apiOptions.transforms = []

      // Add outputs
      options.push(
        '-t', 'contract.wat',
        '-o', 'contract.wasm',
      )

      // Build contract
      const { stdout, error } = await asc.main(options, apiOptions);
      apiOptions.writeExtensionFile();
      
      // Parse output
      let output = stdout.toString().trim()
      if (output.length) {
        output = ';; ' + output.replace(/\n/g, '\n;; ') + '\n'
      }
      output = ';; INFO asc ' + options.join(' ') + '\n' + output
      if (error) {
        binaryEditor.setValue(output + `(module\n ;; FAILURE ${error.message}\n)\n`)
      } else {
        contract_wat.value = outputs['contract.wat']
        contract_wasm.value = outputs['contract.wasm']
        contract_js.value = outputs['contract.js']
        binaryEditor.setValue(output + contract_wat.value)
      }
      didCompile.value = true

      return error
    }

    onMounted(() => {
      const isIframe = window.parent !== window
      if (!isIframe) {
        document.getElementById('header')!.style.display = 'block'
        document.getElementById('buttons')!.style.paddingRight = '15px'
        document.querySelectorAll('.pane').forEach((element: any) => {
          element.style.height = 'calc(100% - 42px - 25px)'
        })
      }

      // Intercept scroll event when focused
      window.addEventListener('wheel', evt => {
        if (document.hasFocus()) {
          evt.stopPropagation()
          evt.preventDefault()
        }
      }, { passive: false })
    })

    return {
      code,
      loading,
      contract_wasm,
      contract_wat,
      contract_js,
      downloadWasm,
      downloadAbi,
      editorDidMount,
      playFrame,
      editor,
      sourcePane,
      binaryPane,
      htmlPane,
      abiPane,
    }
  }
})
</script>

<style>
    /* Header (not visible if sandboxed) */
    #header {
      display: none;
      background: #007acc;
      font-size: 12px;
      color: #fff;
      padding: 4px 10px;
      height: 25px;
      box-sizing: border-box;
      text-align: center;
    }
    #header h1, #header p {
      margin: 0;
      padding: 0;
      font-size: 1em;
      display: inline-block;
      padding: 0 5px;
    }
    #header a {
      color: #fff;
    }

    /* Loading indicator */
    #loading {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(30, 30, 30, 0.8) url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjMDA3YWNjIiBkPSJNNzMgNTBjMC0xMi43LTEwLjMtMjMtMjMtMjNTMjcgMzcuMyAyNyA1MG0zLjkgMGMwLTEwLjUgOC41LTE5LjEgMTkuMS0xOS4xUzY5LjEgMzkuNSA2OS4xIDUwIj48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCA1MCA1MCIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgNTAgNTAiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=') center center no-repeat;
      background-size: 100px 100px;
      z-index: 9000;
      user-select: none;
    }

    /* Editor tabs */
    #tabs {
      background: #2d2d2d;
      padding: 0 10px 0 10px;
      user-select: none;
      height: 34px;
      box-sizing: border-box;
    }
    #tabs .tab {
      display: inline-block;
      font-size: 0.9rem;
      font-weight: 300;
      padding: 8px 16px 8px 34px;
      background: #2d2d2d;
      background-size: 20px 20px;
      background-repeat: no-repeat;
      background-position: 8px center;
      display: inline-block;
      cursor: pointer;
      text-decoration: none;
    }
    #tabs .tab.active {
      color: #fff;
      background-color: #1e1e1e;
    }
    #tabs .tab.disabled {
      display: none;
    }
    #tabs .tab.source {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHRpdGxlPmZpbGVfdHlwZV90eXBlc2NyaXB0X29mZmljaWFsPC90aXRsZT48cG9seWdvbiBwb2ludHM9IjIgMTYgMiAzMCAxNiAzMCAzMCAzMCAzMCAxNiAzMCAyIDE2IDIgMiAyIDIgMTYiIHN0eWxlPSJmaWxsOiMwMDdhY2MiLz48cGF0aCBkPSJNMjQuNTY0LDE0Ljg4NGEzLjQ4NSwzLjQ4NSwwLDAsMSwxLjc1MSwxLjAwOSw0LjYxMSw0LjYxMSwwLDAsMSwuNjcxLjljLjAwOS4wMzYtMS4yMDkuODUzLTEuOTQ3LDEuMzExLS4wMjcuMDE4LS4xMzMtLjEtLjI1My0uMjc2YTEuNTg3LDEuNTg3LDAsMCwwLTEuMzE2LS43OTFjLS44NDktLjA1OC0xLjQuMzg3LTEuMzkxLDEuMTI5YTEuMDI3LDEuMDI3LDAsMCwwLC4xMi41MjRjLjE4Ny4zODcuNTMzLjYxOCwxLjYyMiwxLjA4OSwyLC44NjIsMi44NjIsMS40MzEsMy40LDIuMjRhNC4wNjMsNC4wNjMsMCwwLDEsLjMyNCwzLjQxMywzLjc1MywzLjc1MywwLDAsMS0zLjEsMi4yMTgsOC41ODQsOC41ODQsMCwwLDEtMi4xMzMtLjAyMiw1LjE0NSw1LjE0NSwwLDAsMS0yLjg0OS0xLjQ4NCw0Ljk0Nyw0Ljk0NywwLDAsMS0uNzI5LTEuMDgsMi4wOTIsMi4wOTIsMCwwLDEsLjI1OC0uMTY0Yy4xMjQtLjA3MS42LS4zNDIsMS4wNC0uNmwuOC0uNDY3TDIxLDI0LjA4QTMuNzU5LDMuNzU5LDAsMCwwLDIyLjA2NywyNS4xYTIuNiwyLjYsMCwwLDAsMi43MjQtLjEzOCwxLjIxNywxLjIxNywwLDAsMCwuMTU2LTEuNTUxYy0uMjE4LS4zMTEtLjY2Mi0uNTczLTEuOTI0LTEuMTJhNi45Myw2LjkzLDAsMCwxLTIuNjM2LTEuNjIyLDMuNjkyLDMuNjkyLDAsMCwxLS43NjktMS40LDUuNjA2LDUuNjA2LDAsMCwxLS4wNDktMS43ODcsMy40MTMsMy40MTMsMCwwLDEsMi44NzEtMi42NThBNy4wOTIsNy4wOTIsMCwwLDEsMjQuNTY0LDE0Ljg4NFptLTYuNTczLDEuMTY5TDE4LDE3LjJIMTQuMzU2VjI3LjU1NkgxMS43NzhWMTcuMkg4LjEzM1YxNi4wNzZhMTEuMDE4LDExLjAxOCwwLDAsMSwuMDMxLTEuMTU2Yy4wMTMtLjAxOCwyLjIzMS0uMDI3LDQuOTItLjAyMmw0Ljg5My4wMTNaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+');
    }
    #tabs .tab.binary {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHRpdGxlPmZpbGVfdHlwZV93YXNtPC90aXRsZT48cGF0aCBkPSJNMTkuMTUzLDIuMzVWMi41YTMuMiwzLjIsMCwxLDEtNi40LDBoMFYyLjM1SDJWMzAuMjY5SDI5LjkxOVYyLjM1WiIgc3R5bGU9ImZpbGw6IzY1NGZmMCIvPjxwYXRoIGQ9Ik04LjQ4NSwxNy40aDEuODVMMTEuNiwyNC4xMjNoLjAyM0wxMy4xNCwxNy40aDEuNzMxbDEuMzcxLDYuODFoLjAyN2wxLjQ0LTYuODFoMS44MTVsLTIuMzU4LDkuODg1SDE1LjMyOWwtMS4zNi02LjcyOGgtLjAzNmwtMS40NTYsNi43MjhoLTEuODdabTEzLjEyNCwwaDIuOTE3bDIuOSw5Ljg4NUgyNS41MTVsLS42My0yLjJIMjEuNTYybC0uNDg2LDIuMkgxOS4yMTdabTEuMTEsMi40MzctLjgwNywzLjYyN2gyLjUxMkwyMy41LDE5LjgzMloiIHN0eWxlPSJmaWxsOiNmZmYiLz48L3N2Zz4=');
    }
    #tabs .tab.html {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHRpdGxlPmZpbGVfdHlwZV9odG1sPC90aXRsZT48cG9seWdvbiBwb2ludHM9IjUuOTAyIDI3LjIwMSAzLjY1NSAyIDI4LjM0NSAyIDI2LjA5NSAyNy4xOTcgMTUuOTg1IDMwIDUuOTAyIDI3LjIwMSIgc3R5bGU9ImZpbGw6I2U0NGYyNiIvPjxwb2x5Z29uIHBvaW50cz0iMTYgMjcuODU4IDI0LjE3IDI1LjU5MyAyNi4wOTIgNC4wNjEgMTYgNC4wNjEgMTYgMjcuODU4IiBzdHlsZT0iZmlsbDojZjE2NjJhIi8+PHBvbHlnb24gcG9pbnRzPSIxNiAxMy40MDcgMTEuOTEgMTMuNDA3IDExLjYyOCAxMC4yNDIgMTYgMTAuMjQyIDE2IDcuMTUxIDE1Ljk4OSA3LjE1MSA4LjI1IDcuMTUxIDguMzI0IDcuOTgxIDkuMDgzIDE2LjQ5OCAxNiAxNi40OTggMTYgMTMuNDA3IiBzdHlsZT0iZmlsbDojZWJlYmViIi8+PHBvbHlnb24gcG9pbnRzPSIxNiAyMS40MzQgMTUuOTg2IDIxLjQzOCAxMi41NDQgMjAuNTA5IDEyLjMyNCAxOC4wNDQgMTAuNjUxIDE4LjA0NCA5LjIyMSAxOC4wNDQgOS42NTQgMjIuODk2IDE1Ljk4NiAyNC42NTQgMTYgMjQuNjUgMTYgMjEuNDM0IiBzdHlsZT0iZmlsbDojZWJlYmViIi8+PHBvbHlnb24gcG9pbnRzPSIxNS45ODkgMTMuNDA3IDE1Ljk4OSAxNi40OTggMTkuNzk1IDE2LjQ5OCAxOS40MzcgMjAuNTA3IDE1Ljk4OSAyMS40MzcgMTUuOTg5IDI0LjY1MyAyMi4zMjYgMjIuODk2IDIyLjM3MiAyMi4zNzQgMjMuMDk4IDE0LjIzNyAyMy4xNzQgMTMuNDA3IDIyLjM0MSAxMy40MDcgMTUuOTg5IDEzLjQwNyIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMTUuOTg5IDcuMTUxIDE1Ljk4OSA5LjA3MSAxNS45ODkgMTAuMjM1IDE1Ljk4OSAxMC4yNDIgMjMuNDQ1IDEwLjI0MiAyMy40NDUgMTAuMjQyIDIzLjQ1NSAxMC4yNDIgMjMuNTE3IDkuNTQ4IDIzLjY1OCA3Ljk4MSAyMy43MzIgNy4xNTEgMTUuOTg5IDcuMTUxIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+');
    }
    #tabs .tab.play {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI2RkZCIgZD0iTTE2IDEwdjI4bDIyLTE0eiIvPjwvc3ZnPg==')
    }

    /* Editor buttons */
    #buttons {
      user-select: none;
      float: right;
      padding: 7px 38px 0 0;
    }
    #buttons a {
      color: #fff;
      padding: 1px 0.2rem;
      text-align: center;
      text-decoration: none !important;
      cursor: pointer;
      opacity: 0.5;
      margin-left: 10px;
    }
    #buttons a:hover {
      opacity: 1.0;
    }

    /* Popups */
    .popup {
      position: absolute;
      background: #3c3c3c;
      padding: 0.5rem;
      z-index: 2501;
      animation: fadeIn 83ms linear;
      box-shadow: 0 3px 3px 1px rgba(0,0,0,0.3);
      display: none;
      font-size: 0.8rem;
      user-select: none;
    }
    .popup:before {
      content: "";
      position: absolute;
      top: -24px;
      right: 0;
      border: solid 12px transparent;
      border-bottom-color: #3c3c3c;
      z-index: 2502;
      pointer-events: none;
    }

    /* Options */
    #options .columns {
      display: flex;
    }
    #options .column {
      width: 50%;
    }
    #options h5 {
      padding: 5px 0;
      margin: 0;
      color: #aaa;
      font-size: 0.85em;
    }
    #options p {
      margin: 0;
      padding: 0.2em 0;
      color: #eee;
      font-size: 0.95em;
    }
    #options p:first-child {
      padding-top: 0;
    }
    #options a {
      color: #fff;
    }
    #options label {
      position: relative;
      top: -2px;
      cursor: pointer;
    }
    #options input {
      box-sizing: border-box;
    }
    #options input[type="number"] {
      width: calc(50% - 6px);
      margin-left: 3px;
    }
    #options input[type="text"] {
      width: calc(100% - 6px);
      margin-left: 3px;
    }

    /* Editor panes */
    .pane {
      position: absolute;
      width: 100%;
      height: calc(100% - 34px);
      z-index: 0;
      background: #1e1e1e;
    }
    .pane.active {
      z-index: 1;
    }
    .pane.play iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: #fff;
    }

    #clipboardHelper {
      position: absolute;
      z-index: 0;
      width: 100%;
      opacity: 0;
    }
  </style>