const SCENARIO_TONES = ["baseline", "catch", "learn", "transfer"] as const;

type ScenarioTone = (typeof SCENARIO_TONES)[number];

export interface PrScenario {
  tags: string[];
  tone?: ScenarioTone;
}

function isTone(value: string): value is ScenarioTone {
  return SCENARIO_TONES.includes(value as ScenarioTone);
}

export function parsePrScenario(title: string): PrScenario {
  const markers = title.match(/\[([^\]]+)\]/g) ?? [];
  const tags = markers
    .map((marker) => marker.replace(/^\[|\]$/g, "").trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index);

  const tone = tags.find(isTone);

  return {
    tags,
    tone
  };
}
