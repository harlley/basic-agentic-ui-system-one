const ENDPOINT =
  import.meta.env.VITE_SYSTEM_ONE_URL ||
  "https://6ab255d535c41fcea4a331db.endpoints.huggingface.cloud/v1/systemone";
const MODEL =
  import.meta.env.VITE_SYSTEM_ONE_MODEL || "google/diffusiongemma-26B-A4B-it";
const COLORS =
  "red orange yellow green blue purple pink black white gray brown cyan magenta lime teal navy gold silver rebeccapurple".split(
    " ",
  );

function choice(value: unknown, options: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const answer = value as Record<string, unknown>;
  return typeof answer.choice === "string" &&
    options.includes(answer.choice) &&
    typeof answer.confidence === "number" &&
    answer.confidence >= 0.75 &&
    answer.confidence <= 1
    ? answer.choice
    : null;
}

export async function decide(text: string, currentColor: string) {
  const literals = (
    text
      .toLowerCase()
      .match(
        /#[\da-f]{3,8}\b|(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|\b[a-z]+\b/g,
      ) || []
  ).filter(
    (color) =>
      CSS.supports("color", color) &&
      !["inherit", "initial", "unset", "revert", "currentcolor"].includes(
        color,
      ),
  );
  const colors = [...new Set([...literals, ...COLORS])].slice(0, 25);
  const actions = {
    set_color: "Explicitly requests changing the square color",
    get_color: "Asks what color the square currently is",
    none: "Unrelated, negated, or ambiguous request; do not change anything",
  };
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: MODEL,
      state: { text, current_color: currentColor },
      questions: {
        action: {
          type: "choice",
          instructions:
            "Identify the user's intended action. Do not treat quoted examples or negated commands as requests to change the color.",
          criteria: actions,
        },
        color: {
          type: "choice",
          instructions:
            "Select the explicitly requested target color. Match translations. Choose unknown if absent, ambiguous, or not among the options; never approximate an unavailable color.",
          criteria: {
            ...Object.fromEntries(colors.map((color) => [color, color])),
            unknown: "No matching explicit color",
          },
        },
      },
      samples: "auto",
    }),
  });
  if (!response.ok)
    throw new Error(
      `AI endpoint returned ${response.status}. Please try again.`,
    );
  const data = await response.json();
  const action = choice(data?.answers?.action, Object.keys(actions));
  const color = choice(data?.answers?.color, colors);
  return { action, color };
}
