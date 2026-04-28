import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import App from "../src/App";
import { tauriTest } from "./setup";

beforeEach(() => {
  return tauriTest.invoke("reset_todos", {});
});

describe("greet command", () => {
  it("greets via real Rust", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("Enter a name...");
    await userEvent.type(input, "World");
    fireEvent.click(screen.getByRole("button", { name: /greet/i }));

    await waitFor(() => {
      expect(screen.getByText(/Hello, World!/i)).toBeInTheDocument();
    });
  });
});

describe("todo commands", () => {
  it("adds and lists todos via the rendered app", async () => {
    render(<App />);

    const input = screen.getByLabelText("Todo title");
    await userEvent.type(input, "Write tests");
    await userEvent.click(screen.getByRole("button", { name: /add todo/i }));

    await waitFor(() => {
      expect(screen.getByRole("list", { name: "Todo list" })).toHaveTextContent(
        "Write tests",
      );
    });
  });

  it("deletes a todo via the rendered app", async () => {
    render(<App />);

    const input = screen.getByLabelText("Todo title");
    await userEvent.type(input, "Write tests");
    await userEvent.click(screen.getByRole("button", { name: /add todo/i }));

    await screen.findByRole("button", { name: /delete write tests/i });
    await userEvent.click(
      screen.getByRole("button", { name: /delete write tests/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("list", { name: "Todo list" })).not.toHaveTextContent(
        "Write tests",
      );
    });
  });

  it("initializes app state through the setup init function", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("App state: integration-test")).toBeInTheDocument();
    });
  });

  it("returns a useful error for unknown commands", async () => {
    await expect(tauriTest.invoke("missing_command", {})).rejects.toThrow(
      /unknown_command/,
    );
  });
});
