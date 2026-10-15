// Hindi explanation built only from numbers the scorer already produced.
// Used when Bedrock is not configured, and as the fallback if Bedrock fails.

export type ExplainInput = {
  name: string;
  score: number;
  label: string;
  surplusTonnes: number;
  signals: { arrivals: number; price: number; season: number };
};

export function templateExplanation(input: ExplainInput): string {
  const surplus = Number.isFinite(input.surplusTonnes) ? input.surplusTonnes : 0;
  return [
    `${input.name} का जोखिम स्कोर ${input.score} / 100 है (${input.label}).`,
    `आवक संकेत ${Math.round(input.signals.arrivals)}, भाव संकेत ${Math.round(input.signals.price)}, मौसम संकेत ${Math.round(input.signals.season)}.`,
    `इस सीरीज में लगभग ${surplus} टन अतिरिक्त आवक है.`,
    "इसे पास की प्रोसेसिंग यूनिट को भेजने से यही माल सड़ने से बचता है.",
  ].join(" ");
}
