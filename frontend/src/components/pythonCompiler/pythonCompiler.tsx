"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnChange, OnMount } from "@monaco-editor/react";
import styles from "./pythonCompiler.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/";
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;
const IMPORT_STATEMENT_REGEX = /^\s*(from\s+\S+\s+import|import\s+\S+)/m;

type PyodideLike = {
  setStdout: (options?: {
    batched?: (output: string) => void;
  }) => void;
  setStderr: (options?: {
    batched?: (output: string) => void;
  }) => void;
  loadPackagesFromImports: (code: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setInterruptBuffer: (interruptBuffer?: Int32Array) => void;
};

type LoadPyodideFn = (options?: {
  indexURL?: string;
}) => Promise<PyodideLike>;

declare global {
  interface Window {
    loadPyodide?: LoadPyodideFn;
    __pyodideReadyPromise?: Promise<PyodideLike>;
  }
}

interface PythonCompilerProps {
  title?: string;
  initialCode?: string;
  editorHeight?: number | string;
  className?: string;
  onCodeChange?: (value: string) => void;
  onOutputChange?: (value: string) => void;
}

interface FriendlyRuntimeError {
  errorType: string;
  errorDescription: string;
  headline: string;
  hint: string;
  technicalMessage: string;
  technicalDetails: string;
  lineNumber: number | null;
}

const FRIENDLY_ERROR_MAP: Record<string, { headline: string; hint: string }> = {
  SyntaxError: {
    headline: "Я не понимаю эту строку",
    hint: "Проверь скобки, кавычки и двоеточие в конце команды.",
  },
  IndentationError: {
    headline: "Отступы запутались",
    hint: "В блоках if/for/def сделай одинаковые отступы пробелами.",
  },
  NameError: {
    headline: "Не нашёл такое имя",
    hint: "Проверь, нет ли опечатки и создана ли переменная выше.",
  },
  TypeError: {
    headline: "Эти значения не сочетаются",
    hint: "Проверь типы данных: строка, число, список и т.д.",
  },
  ZeroDivisionError: {
    headline: "Делить на ноль нельзя",
    hint: "Проверь делитель, он должен быть не равен 0.",
  },
  IndexError: {
    headline: "Такого номера элемента нет",
    hint: "Проверь длину списка и индекс элемента.",
  },
  KeyError: {
    headline: "Такого ключа нет",
    hint: "Проверь, что ключ существует в словаре.",
  },
  ValueError: {
    headline: "Значение не подошло",
    hint: "Проверь формат данных, которые передаёшь в функцию.",
  },
  ModuleNotFoundError: {
    headline: "Модуль не найден",
    hint: "Проверь название модуля в import.",
  },
  ImportError: {
    headline: "Проблема с import",
    hint: "Проверь import и имя импортируемого объекта.",
  },
  KeyboardInterrupt: {
    headline: "Выполнение остановлено",
    hint: "Код остановлен по кнопке «Остановить».",
  },
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка";
}

function parsePythonRuntimeError(rawError: string): FriendlyRuntimeError {
  const technicalDetails = rawError.replace(/\r\n/g, "\n").trim() || "PythonError: ошибка выполнения";

  let lineNumber: number | null = null;
  const tracebackLineRegex = /File\s+"[^"]*"\s*,\s*line\s+(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = tracebackLineRegex.exec(technicalDetails)) !== null) {
    lineNumber = Number(match[1]);
  }

  if (lineNumber === null) {
    const fallbackLineRegex = /line\s+(\d+)/g;
    while ((match = fallbackLineRegex.exec(technicalDetails)) !== null) {
      lineNumber = Number(match[1]);
    }
  }

  const lines = technicalDetails
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lastLine = lines[lines.length - 1] ?? "PythonError: ошибка выполнения";

  const typedMatch = lastLine.match(/^([A-Za-z_][\w]*(?:Error|Exception)):\s*(.*)$/);
  const errorType = typedMatch?.[1] ?? "PythonError";
  const errorDescription = typedMatch?.[2] || "не удалось определить описание ошибки";

  const preset = FRIENDLY_ERROR_MAP[errorType] ?? {
    headline: "Код почти получился",
    hint: "Проверь опечатки, скобки, кавычки и двоеточия.",
  };

  const lineHint = lineNumber !== null ? `Строка ${lineNumber}. ` : "";

  return {
    errorType,
    errorDescription,
    headline: preset.headline,
    hint: `${lineHint}${preset.hint}`,
    technicalMessage: `${errorType}: ${errorDescription}`,
    technicalDetails,
    lineNumber,
  };
}

function getColumnsFromCaret(
  details: string,
  targetLine: number
): { startColumn: number; endColumn: number } | null {
  const lines = details.split("\n");
  let fileLineIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/File\s+"[^"]*"\s*,\s*line\s+(\d+)/);
    if (match && Number(match[1]) === targetLine) {
      fileLineIndex = i;
    }
  }

  if (fileLineIndex === -1) {
    return null;
  }

  const caretLine = lines[fileLineIndex + 2] ?? "";
  if (!caretLine.includes("^")) {
    return null;
  }

  const first = caretLine.indexOf("^");
  const last = caretLine.lastIndexOf("^");

  return {
    startColumn: first + 1,
    endColumn: last + 2,
  };
}

function getTokenFromError(error: FriendlyRuntimeError): string | null {
  if (error.errorType === "NameError") {
    const match = error.errorDescription.match(/name ['"]([^'"]+)['"] is not defined/);
    return match?.[1] ?? null;
  }

  if (error.errorType === "AttributeError") {
    const match = error.errorDescription.match(/attribute ['"]([^'"]+)['"]/);
    return match?.[1] ?? null;
  }

  return null;
}

function getColumnsFromToken(
  lineText: string,
  token: string
): { startColumn: number; endColumn: number } | null {
  const index = lineText.indexOf(token);
  if (index === -1) {
    return null;
  }

  return {
    startColumn: index + 1,
    endColumn: index + token.length + 1,
  };
}

async function ensurePyodideLoader(): Promise<LoadPyodideFn> {
  if (typeof window === "undefined") {
    throw new Error("Pyodide can only run in browser");
  }

  if (window.loadPyodide) {
    return window.loadPyodide;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${PYODIDE_SCRIPT_URL}"]`
  );

  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      if (window.loadPyodide) {
        resolve();
        return;
      }

      const onLoad = () => resolve();
      const onError = () => reject(new Error("Failed to load pyodide.js"));

      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
    });
  } else {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PYODIDE_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load pyodide.js"));
      document.head.appendChild(script);
    });
  }

  if (!window.loadPyodide) {
    throw new Error("loadPyodide is unavailable after script load");
  }

  return window.loadPyodide;
}

function loadPyodideOnce(): Promise<PyodideLike> {
  if (!window.__pyodideReadyPromise) {
    window.__pyodideReadyPromise = ensurePyodideLoader().then((loadPyodide) =>
      loadPyodide({ indexURL: PYODIDE_INDEX_URL })
    );
  }

  return window.__pyodideReadyPromise;
}

function codeHasImportStatement(sourceCode: string): boolean {
  return IMPORT_STATEMENT_REGEX.test(sourceCode);
}

let preloadAssetsPromise: Promise<void> | null = null;

export async function preloadPythonRuntime(): Promise<void> {
  await loadPyodideOnce();
}

export function preloadPythonCompilerAssets(): Promise<void> {
  if (!preloadAssetsPromise) {
    preloadAssetsPromise = Promise.all([
      import("@monaco-editor/react"),
      preloadPythonRuntime(),
    ]).then(() => undefined);
  }

  return preloadAssetsPromise;
}

export default function PythonCompiler({
  title = "Python-песочница",
  initialCode = "",
  editorHeight = 320,
  className = "",
  onCodeChange,
  onOutputChange,
}: PythonCompilerProps) {
  const pyodideRef = useRef<PyodideLike | null>(null);
  const interruptBufferRef = useRef<Int32Array | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const onCodeChangeRef = useRef(onCodeChange);
  const onOutputChangeRef = useRef(onOutputChange);
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [friendlyError, setFriendlyError] = useState<FriendlyRuntimeError | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    onOutputChangeRef.current = onOutputChange;
  }, [onOutputChange]);

  useEffect(() => {
    setCode(initialCode);
    onCodeChangeRef.current?.(initialCode);
    setOutput("");
    onOutputChangeRef.current?.("");
  }, [initialCode]);

  useEffect(() => {
    let cancelled = false;

    const setupPyodide = async () => {
      try {
        setRuntimeError(null);
        const pyodide = await loadPyodideOnce();
        const interruptBuffer =
          typeof SharedArrayBuffer !== "undefined"
            ? new Int32Array(new SharedArrayBuffer(4))
            : new Int32Array(new ArrayBuffer(4));

        interruptBuffer[0] = 0;
        pyodide.setInterruptBuffer(interruptBuffer);

        if (!cancelled) {
          pyodideRef.current = pyodide;
          interruptBufferRef.current = interruptBuffer;
        }
      } catch (error) {
        if (!cancelled) {
          setRuntimeError(`Не удалось загрузить Pyodide: ${getErrorMessage(error)}`);
        }
      } finally {
        if (!cancelled) {
          setIsRuntimeLoading(false);
        }
      }
    };

    void setupPyodide();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearEditorMarkers = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    monaco.editor.setModelMarkers(model, "python-runtime", []);
  }, []);

  const highlightEditorError = useCallback((error: FriendlyRuntimeError) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || error.lineNumber === null) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    const safeLine = Math.max(1, Math.min(error.lineNumber, model.getLineCount()));
    const lineText = model.getLineContent(safeLine);

    const caretColumns = getColumnsFromCaret(error.technicalDetails, safeLine);
    const token = getTokenFromError(error);
    const tokenColumns = token ? getColumnsFromToken(lineText, token) : null;

    const startColumn =
      caretColumns?.startColumn ??
      tokenColumns?.startColumn ??
      Math.max(1, lineText.search(/\S/) + 1);
    const lineMaxColumn = model.getLineMaxColumn(safeLine);
    const safeStartColumn = Math.min(Math.max(startColumn, 1), Math.max(1, lineMaxColumn - 1));
    const fallbackEndColumn = Math.max(safeStartColumn + 1, lineMaxColumn);
    const endColumn = caretColumns?.endColumn ?? tokenColumns?.endColumn ?? fallbackEndColumn;

    monaco.editor.setModelMarkers(model, "python-runtime", [
      {
        startLineNumber: safeLine,
        startColumn: safeStartColumn,
        endLineNumber: safeLine,
        endColumn: Math.min(Math.max(endColumn, safeStartColumn + 1), lineMaxColumn),
        message: error.technicalMessage,
        severity: monaco.MarkerSeverity.Error,
      },
    ]);

    editor.revealLineInCenter(safeLine);
  }, []);

  const handleEditorMount = useCallback<OnMount>((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

  const handleEditorChange = useCallback<OnChange>(
    (value) => {
      const nextCode = value ?? "";
      setCode(nextCode);
      onCodeChange?.(nextCode);
      setFriendlyError(null);
      clearEditorMarkers();
    },
    [clearEditorMarkers, onCodeChange]
  );

  const handleRun = async () => {
    const pyodide = pyodideRef.current;
    if (!pyodide || isRunning) {
      return;
    }

    setIsRunning(true);
    setIsStopping(false);
    setOutput("");
    onOutputChange?.("");
    setFriendlyError(null);
    clearEditorMarkers();
    if (interruptBufferRef.current) {
      interruptBufferRef.current[0] = 0;
    }

    const stdoutBuffer: string[] = [];
    const stderrBuffer: string[] = [];

    try {
      pyodide.setStdout({
        batched: (line: string) => {
          stdoutBuffer.push(line);
        },
      });
      pyodide.setStderr({
        batched: (line: string) => {
          stderrBuffer.push(line);
        },
      });

      if (codeHasImportStatement(code)) {
        await pyodide.loadPackagesFromImports(code);
      }
      const result = await pyodide.runPythonAsync(code);

      const chunks: string[] = [];
      if (stdoutBuffer.length > 0) {
        chunks.push(stdoutBuffer.join("\n"));
      }

      if (result !== undefined) {
        chunks.push(String(result));
      }

      if (stderrBuffer.length > 0) {
        chunks.push(stderrBuffer.join("\n"));
      }

      const nextOutput = chunks.length > 0 ? chunks.join("\n") : "Код выполнен, но вывода нет.";
      setOutput(nextOutput);
      onOutputChange?.(nextOutput);
    } catch (error) {
      const parsedError = parsePythonRuntimeError(getErrorMessage(error));
      const chunks: string[] = [];

      if (stdoutBuffer.length > 0) {
        chunks.push(stdoutBuffer.join("\n"));
      }

      if (stderrBuffer.length > 0) {
        chunks.push(stderrBuffer.join("\n"));
      }

      if (chunks.length === 0 && parsedError.errorType !== "KeyboardInterrupt") {
        chunks.push("Код остановился из-за ошибки. Посмотри подсказку выше.");
      }

      if (parsedError.errorType === "KeyboardInterrupt") {
        chunks.push("Выполнение остановлено.");
      } else if (parsedError.lineNumber !== null) {
        chunks.push(`Подсказка: ошибка на строке ${parsedError.lineNumber}.`);
      }

      const nextOutput = chunks.join("\n\n");
      setOutput(nextOutput);
      onOutputChange?.(nextOutput);
      setFriendlyError(parsedError);

      if (parsedError.errorType !== "KeyboardInterrupt" && parsedError.lineNumber !== null) {
        highlightEditorError(parsedError);
      }
    } finally {
      if (interruptBufferRef.current) {
        interruptBufferRef.current[0] = 0;
      }
      setIsStopping(false);
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (!isRunning || isStopping) {
      return;
    }

    const interruptBuffer = interruptBufferRef.current;
    if (!interruptBuffer) {
      setOutput((prev) => {
        const nextOutput = prev
          ? `${prev}\n\nНе удалось остановить: буфер прерывания недоступен.`
          : "Не удалось остановить: буфер прерывания недоступен.";
        onOutputChange?.(nextOutput);
        return nextOutput;
      });
      return;
    }

    setIsStopping(true);
    interruptBuffer[0] = 2;
    setOutput((prev) => {
      const nextOutput = prev
        ? `${prev}\n\nОтправляю сигнал остановки...`
        : "Отправляю сигнал остановки...";
      onOutputChange?.(nextOutput);
      return nextOutput;
    });
  };

  const isRunDisabled = isRuntimeLoading || !!runtimeError || isRunning;
  const isStopDisabled = !isRunning || isStopping;
  const statusText = runtimeError
    ? runtimeError
    : isRuntimeLoading
      ? "Загружаю Python..."
      : "Python готов";
  const statusClass = runtimeError
    ? styles.statusError
    : isRuntimeLoading
      ? styles.statusLoading
      : styles.statusReady;

  return (
    <section className={`${styles.container} ${className}`.trim()}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={`${styles.status} ${statusClass}`}>{statusText}</p>
      </div>

      <div className={styles.editor}>
        <MonacoEditor
          defaultLanguage="python"
          value={code}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          height={editorHeight}
          theme="vs-light"
          options={{
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.runButton}
          type="button"
          disabled={isRunDisabled}
          onClick={handleRun}
        >
          {isRunning ? "Выполняю..." : "Запустить"}
        </button>
        <button
          className={styles.stopButton}
          type="button"
          disabled={isStopDisabled}
          onClick={handleStop}
        >
          {isStopping ? "Останавливаю..." : "Остановить"}
        </button>
      </div>

      {friendlyError && (
        <div className={styles.errorCard} role="alert">
          <p className={styles.errorTitle}>{friendlyError.headline}</p>
          <p className={styles.errorHint}>{friendlyError.hint}</p>
          <details className={styles.errorDetails}>
            <summary>Показать техническую ошибку</summary>
            <pre className={styles.errorTechnical}>{friendlyError.technicalDetails}</pre>
          </details>
        </div>
      )}

      <div className={styles.outputWrap}>
        <p className={styles.outputLabel}>Вывод</p>
        <pre className={`${styles.output} ${friendlyError ? styles.outputError : ""}`.trim()}>
          {output || "Пока пусто."}
        </pre>
      </div>
    </section>
  );
}
