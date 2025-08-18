export type LanguageKey = "python" | "javascript" | "java" | "cpp" | "c" | "csharp";

export const LANGUAGE_CATALOG: { key: LanguageKey; id: number; label: string; ext: string; monaco: string }[] = [
  { key: "python",     id: 71, label: "Python 3",              ext: "py",  monaco: "python" },
  { key: "javascript", id: 63, label: "JavaScript (Node.js)",  ext: "js",  monaco: "javascript" },
  { key: "java",       id: 62, label: "Java (OpenJDK)",        ext: "java",monaco: "java" },
  { key: "cpp",        id: 76, label: "C++ (GCC)",             ext: "cpp", monaco: "cpp" },
  { key: "c",          id: 54, label: "C (GCC)",               ext: "c",   monaco: "c" },
  { key: "csharp",     id: 51, label: "C# (Mono)",             ext: "cs",  monaco: "csharp" }
];

export const DEFAULT_STARTERS: Record<LanguageKey, string> = {
  python:     "# Python 3\nprint('Hello, world!')\n",
  javascript: "// Node.js\nconsole.log('Hello, world!');\n",
  java:       "public class Main { public static void main(String[] args){ System.out.println(\"Hello, world!\"); } }",
  cpp:        "#include <bits/stdc++.h>\nusing namespace std;int main(){cout<<\"Hello, world!\\n\";}\n",
  c:          "#include <stdio.h>\nint main(){ printf(\"Hello, world!\\n\"); return 0; }\n",
  csharp:     "using System; class Program { static void Main(){ Console.WriteLine(\"Hello, world!\"); } }"
};