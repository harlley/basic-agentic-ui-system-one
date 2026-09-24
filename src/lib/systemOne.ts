import colorNames from "color-name";

const ENDPOINT =
  import.meta.env.VITE_SYSTEM_ONE_URL ||
  "https://6ab255d535c41fcea4a331db.endpoints.huggingface.cloud/v1/systemone";
const MODEL =
  import.meta.env.VITE_SYSTEM_ONE_MODEL || "google/diffusiongemma-26B-A4B-it";
const COLORS = [...Object.keys(colorNames), "transparent"];

function choice(
  value: unknown,
  options: string[],
  minimumConfidence = 0.5,
): string | null {
  if (!value || typeof value !== "object") return null;
  const answer = value as Record<string, unknown>;
  return typeof answer.choice === "string" &&
    options.includes(answer.choice) &&
    typeof answer.confidence === "number" &&
    answer.confidence >= minimumConfidence &&
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
  const colors = [...new Set([...literals, ...COLORS])];
  const actions = {
    set_color:
      "Requests or suggests a color for the square, directly or through an object, character, mood, theme, or association",
    get_color: "Asks what color the square currently is",
    none: "Unrelated message or instruction not to change the square",
  };
  const colorQuestion = (options: string[]) => ({
    type: "choice",
    instructions:
      "Choose the best color for the user request. Honor explicit colors and translations. For mixtures such as colors joined by + or mix/misture, choose the closest resulting blended color from the options, not just one ingredient. Assume intuitive paint mixing unless the user specifies light/RGB mixing. If a mixture mentions the current color, use current_color as that ingredient. Otherwise suggest a representative color using common associations with the mentioned object, character, mood, or theme. If multiple colors fit, choose the most iconic or suitable one; creative requests do not require an explicit color. For an open-ended request to suggest any color, pick a pleasant color different from current_color. Choose the closest option in this group even if the exact color is unavailable. Prefer the exact requested spelling when it is offered.",
    criteria: Object.fromEntries(options.map((color) => [color, color])),
  });
  const signal = AbortSignal.timeout(30_000);
  async function ask(questions: Record<string, unknown>) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: MODEL,
        state: { text, current_color: currentColor },
        questions,
        samples: "auto",
        think: 128,
        steps: 4,
      }),
    });
    if (!response.ok)
      throw new Error(`AI endpoint returned ${response.status}.`);
    const data = await response.json();
    if (!data?.answers || typeof data.answers !== "object") {
      throw new Error("Invalid System One response");
    }
    return data.answers;
  }
  // System One allows at most 26 options per question. Keep every CSS name
  // available by choosing group winners, then comparing those winners.
  const groups: string[][] = [];
  for (let i = 0; i < colors.length; i += 25)
    groups.push(colors.slice(i, i + 25));
  if (groups.at(-1)?.length === 1) {
    const previous = groups[groups.length - 2];
    groups.at(-1)?.push(...previous.splice(-1));
  }
  const answers = await ask({
    action: {
      type: "choice",
      instructions:
        "This is a creative color-control interface. Treat color mixtures (including colors joined by +), standalone colors, objects, characters, moods, and requests for color suggestions as set_color, even without a verb or explicit color name. Infer the user's intended association. Only get_color asks about the square's current color. Unrelated conversation, quoted examples, and instructions not to change are none.",
      criteria: actions,
    },
    ...Object.fromEntries(
      groups.map((group, i) => [`color_${i}`, colorQuestion(group)]),
    ),
  });
  const action = choice(answers.action, Object.keys(actions));
  if (action !== "set_color") return { action, color: null };
  let candidates = groups.map((group, i) => {
    const selected = choice(answers[`color_${i}`], group, 0);
    if (!selected) throw new Error("Missing color decision");
    return selected;
  });
  while (candidates.length > 1) {
    const winners: string[] = [];
    for (let i = 0; i < candidates.length; i += 25) {
      const options = candidates.slice(i, i + 25);
      if (options.length === 1) {
        winners.push(options[0]);
        continue;
      }
      const result = await ask({ color: colorQuestion(options) });
      const winner = choice(result.color, options, 0);
      if (!winner) throw new Error("Missing final color decision");
      winners.push(winner);
    }
    candidates = winners;
  }
  return { action, color: candidates[0] };
}
