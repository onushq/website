// Sources cited on the page, in the order they are first cited.
export const sources = [
  {
    id: "two-x",
    title: "He et al., AI Writes Faster Than Humans Can Review: A Longitudinal Study of an Enterprise “2×” Mandate, July 2026",
    url: "https://arxiv.org/abs/2607.01904",
  },
  {
    id: "specbench",
    title: "Zhao et al., SpecBench: Measuring Reward Hacking in Long-Horizon Coding Agents, May 2026",
    url: "https://arxiv.org/html/2605.21384v1",
  },
  {
    id: "escalation",
    title: "Can escalation channels redirect reward hacking toward defect disclosure?, August 2026",
    url: "https://arxiv.org/abs/2608.29460",
  },
  {
    id: "self-preference",
    title: "Panickssery, Bowman and Feng, LLM Evaluators Recognize and Favor Their Own Generations, April 2024",
    url: "https://arxiv.org/abs/2404.13076",
  },
] as const;

export type SourceId = (typeof sources)[number]["id"];

export const citeNumber = (id: SourceId) => sources.findIndex((s) => s.id === id) + 1;
