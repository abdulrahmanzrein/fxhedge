import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askAssistant, AssistantUnavailableError } from "../assistant/ask";

const ENV_BACKUP = { ...process.env };

describe("askAssistant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ENV_BACKUP };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("throws unavailable when no provider keys are configured", async () => {
    await expect(askAssistant("What is murabaha?")).rejects.toBeInstanceOf(
      AssistantUnavailableError,
    );
  });

  it("uses Groq chat completions when GROQ_API_KEY is configured", async () => {
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_MODEL = "openai/gpt-oss-20b";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Murabaha is a cost-plus sale contract." } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askAssistant("What is murabaha?");

    expect(result).toEqual({
      answer: "Murabaha is a cost-plus sale contract.",
      model: "openai/gpt-oss-20b",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-groq-key");
  });

  it("throws unavailable when Groq returns an empty answer", async () => {
    process.env.GROQ_API_KEY = "test-groq-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "   " } }] }),
      }),
    );

    await expect(askAssistant("What is murabaha?")).rejects.toBeInstanceOf(
      AssistantUnavailableError,
    );
  });
});
