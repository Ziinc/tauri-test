import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type Todo = {
  id: number;
  title: string;
};

function App() {
  const [appStateLabel, setAppStateLabel] = useState("");
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [todoTitle, setTodoTitle] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function loadTodos() {
    const nextTodos = await invoke<Todo[]>("list_todos");
    setTodos(nextTodos);
  }

  async function loadAppStateLabel() {
    const nextLabel = await invoke<string>("get_app_state_label");
    setAppStateLabel(nextLabel);
  }

  async function addTodo() {
    await invoke("add_todo", { title: todoTitle });
    setTodoTitle("");
    await loadTodos();
  }

  async function deleteTodo(id: number) {
    await invoke("delete_todo", { id });
    await loadTodos();
  }

  useEffect(() => {
    void loadAppStateLabel();
    void loadTodos();
  }, []);

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>
      <p>App state: {appStateLabel}</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <section>
        <h2>Todos</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void addTodo();
          }}
        >
          <label htmlFor="todo-input">Todo title</label>
          <input
            id="todo-input"
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.currentTarget.value)}
          />
          <button type="submit">Add todo</button>
        </form>
        <ul aria-label="Todo list">
          {todos.map((todo) => (
            <li key={todo.id}>
              <span>{todo.title}</span>
              <button type="button" onClick={() => void deleteTodo(todo.id)}>
                Delete {todo.title}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
