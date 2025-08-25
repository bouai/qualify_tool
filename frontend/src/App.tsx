import React, { useMemo, useState } from "react";
import axios from "axios";


// --- Types
export type PredictionResponse = {
  label: "Agentic AI" | "Classical ML" | "Gen AI" | "Business Automation";
  avg_confidence: number; // 0..1
  ucl: number; // 0..1
  lcl: number; // 0..1
};

// --- Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// --- Parameter metadata
const PARAMS = [
  {
    key: "is_process_simple",
    label: "Is process simple?",
    description:
      "Select, if process follows a clear path from start to finish, with few exceptions and no confusing branches.",
  },
  {
    key: "can_specify_business_rules",
    label: "Can you specify business rules?",
    description:
      "Select, if the business rules can fully handle the use case, are easy to maintain, and rarely need changes.",
  },
  {
    key: "will_occasional_errors_be_tolerated",
    label: "Are occasional errors tolerated?",
    description:
      "Select, if the software can tolerate occasional errors or minor inaccuracies without a significant impact.",
  },
  {
    key: "will_error_be_propagated",
    label: "Will error be propagated?",
    description:
      "Select, if an error in one step can affect downstream systems or outcomes. Don't select if the error can be contained easily and does not impact other features or end users.",
  },
  {
    key: "is_use_case_transactional_in_nature",
    label: "Is the use case transactional?",
    description:
      "Select, if the use case can involve CRUD Operations, with short-lived atomic transactions.",
  },
  {
    key: "are_you_building_learning_system",
    label: "Building a learning system?",
    description:
      "Select, if the system improves over time using data, user feedback, and adoption -without relying on SME expertise for performance enhancement.",
  },
  {
    key: "high_stakes_environment",
    label: "High-stakes environment?",
    description:
      "Select, if the use case must operate in mission-critical scenarios where failure leads to a significant business impact.",
  },
  {
    key: "hyper_personalization",
    label: "Hyper-personalization required?",
    description:
      "Select, if the use case delivers highly personalized experiences at an individual level, including customer outreach, engagement, activation, and nurturing.",
  },
  {
    key: "unstructured_text_input",
    label: "Unstructured text input?",
    description:
      "Select, if the input is free-form text (e.g, email, chat) rather than structured formats like forms or databases, and is not encoded or constrained.",
  },
  {
    key: "is_input_data_multi_modal",
    label: "Multi-modal input?",
    description:
      "Select, if the input includes formats like images, audio, video, rather than plain text or structured data.",
  },
  {
    key: "language_generation",
    label: "Language generation needed?",
    description:
      "Select, if the use case requires generating new content in natural language as output.",
  },
  {
    key: "are_autonomous_decisions_required",
    label: "Autonomous decisions required?",
    description:
      "Select, if the use case requires the system to make decisions independently without human intervention.",
  },
  {
    key: "is_reasoning_required",
    label: "Is reasoning required?",
    description:
      "Select, if the use case requires reasoning with domain knowledge, involving analysis of facts and counterfactuals, handling competing constraints, optimization, decision making independently, without human intervention.",
  },
  {
    key: "tool_integration",
    label: "Tool integration?",
    description:
      "Select, if the use case requires integration with external tools such as web search, vector databases, APIs, external knowledge sources, custom tools, websites, business dashboards, or scoring engines.",
  },
  {
    key: "dynamic_goals",
    label: "Dynamic goals?",
    description:
      "Select, if the use case requires adaptive, context-aware behaviors that can optimize or shift in real time, rather than following a fixed static plan.",
  },
] as const;

// Derive a union type of keys from PARAMS
type ParamKey = typeof PARAMS[number]["key"];

export default function App() {
  const [useCaseName, setUseCaseName] = useState("");
  const [values, setValues] = useState<Record<ParamKey, boolean>>(() => {
    const init: Record<ParamKey, boolean> = Object.create(null);
    PARAMS.forEach((p) => (init[p.key] = false));
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const yesCount = useMemo(
    () => Object.values(values).filter(Boolean).length,
    [values]
  );

  const resetAll = () => {
    const next = { ...values };
    PARAMS.forEach((p) => (next[p.key] = false));
    setValues(next);
    setResult(null);
    setError(null);
  };

  async function onPredict() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        use_case_name: useCaseName || "Untitled Use Case",
      };
      PARAMS.forEach((p) => {
        payload[p.key] = values[p.key] ? 1 : 0; // binary 1/0
      });

      const { data } = await axios.post<PredictionResponse>(
        `${API_BASE}/predict`,
        payload,
        { timeout: 20000 }
      );
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2140] to-[#051429] text-white">
      {/* Header */}
      <header className="px-6 py-5 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            AIX | AI-Labs
          </h1>
          <h1 className="text-4xl font-extrabold tracking-wide text-amber-400">
          Use Case Qualification Tool
          </h1>
          {/* Infosys Logo */}
          <img
            src="/infosys_logo.png" // <-- update to correct file name
            alt="Infosys Logo"
            className="h-10 w-auto"
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Top row */}
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
            <label className="block text-sm font-medium mb-2 opacity-90">
              Use Case Name
            </label>
            <input
              placeholder="e.g., Automated Claims Triage"
              value={useCaseName}
              onChange={(e) => setUseCaseName(e.target.value)}
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400/60 placeholder:text-white/50"
            />
            <div className="mt-3 text-xs text-white/70">
              Give your scenario a clear name so it appears in reports.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
            <div className="text-sm opacity-90 mb-3">Summary</div>
            <div className="text-3xl font-semibold">{yesCount}/15</div>
            <div className="text-xs text-white/70">parameters set to Yes</div>
            <button
              onClick={resetAll}
              className="mt-4 text-sm rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10"
            >
              Reset all
            </button>
          </div>
        </section>

        {/* Parameters grid */}
        <section className="grid gap-4 md:grid-cols-2">
          {PARAMS.map((p) => (
            <label
              key={p.key}
              className="group flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={values[p.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [p.key]: e.target.checked }))
                }
                className="mt-1 h-5 w-5 rounded-md border-white/20 bg-white/5 focus:ring-2 focus:ring-blue-400/60"
              />
              <div>
                <div className="font-medium leading-tight">{p.label}</div>
                <div className="text-sm text-white/70 mt-1">{p.description}</div>
              </div>
            </label>
          ))}
        </section>

        {/* Action + Result */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              onClick={onPredict}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/40"
            >
              {loading ? (
                <span className="animate-pulse">Sending…</span>
              ) : (
                <>
                  <span className="mr-2">▶</span> Model Prediction
                </>
              )}
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 min-h-[112px]">
            {error && (
              <div className="text-red-300 text-sm">{String(error)}</div>
            )}
            {!error && !result && (
              <div className="text-white/70 text-sm">
                Prediction output will appear here.
              </div>
            )}
            {result && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-white/60">
                  Predicted Label
                </div>
                <div className="text-lg font-semibold">{result.label}</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-white/60">
                  Confidence (Avg · LCL · UCL)
                </div>
                <div className="text-sm">
                  {(result.avg_confidence * 100).toFixed(1)}% ·{" "}
                  {(result.lcl * 100).toFixed(1)}% ·{" "}
                  {(result.ucl * 100).toFixed(1)}%
                </div>
                <div className="mt-2 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, result.avg_confidence * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 pt-6 text-xs text-white/60 border-t border-white/10">
          Tip: Read parameter description to select parameters. Post
          configuration click{" "}
          <span className="mx-1 font-medium">Model Prediction to get result</span>.
        </footer>
        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-amber-400 mb-6">
            Frequently Asked Questions (FAQs)
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Q1: What is the purpose of conformal prediction in this workflow?",
                a: "Conformal prediction ensures that the model prediction sets contain the true label with a specified probability (e.g., 90%). It adds a layer of reliability to predictions, especially useful when abstaining or suggesting multiple plausible labels."
              },
              {
                q: "Q2: Why use rule-based labeling for Silver data?",
                a: "Rule-based labeling allows you to bootstrap medium-confidence data using domain knowledge. It's fast, interpretable, and helps expand the training set without manual annotation."
              },
              {
                q: "Q3: What does pseudo-labeling Bronze data achieve?",
                a: "Pseudo-labeling uses the trained model to assign labels to low-confidence data. This helps scale the dataset further, enabling semi-supervised learning while maintaining awareness of uncertainty."
              },
              {
                q: "Q4: Why use interaction features in the pipeline?",
                a: "Pairwise interactions capture relationships between binary features (e.g., 'Feature A AND Feature B'). This often improves model performance in structured, rule-driven domains."
              },
              {
                q: "Q5: What does the abstain threshold control?",
                a: "It defines the minimum confidence required for the model to make a prediction. If the highest class probability is below this threshold, the model abstains, signaling uncertainty."
              },
              {
                q: "Q6: How does active learning help here?",
                a: "Active learning identifies the most uncertain unlabeled examples from the full binary space. These are ideal candidates for manual review or rule-based labeling, improving model performance efficiently."
              },
              {
                q: "Q7: Can this workflow be extended to non-binary features?",
                a: "Yes, but you'd need to adjust the pipeline (e.g., remove PolynomialFeatures[interaction_only=True] or use different encoders) and rethink the full state space generation logic."
              },
              {
                q: "Q8: What's the role of run_ai_classifier_adaptor in the final section?",
                a: "It's a wrapper or alias for run_ai_classifier_with_active, allowing flexible integration into other workflows like pseudo-labeling. You can pass custom arguments via workflow_kwargs."
              },
              {
                q: "Q9: Have we done bootstrapping here?",
                a: "Yes, a form of bootstrapping has been done in the sense of progressive labeling and training:\nGold: High-confidence labeled data used for initial training.\nSilver: Rule-based labeling applied, then included in training.\nBronze: Pseudo-labeled using the trained model on Gold + Silver.\nThis staged approach bootstraps by iteratively expanding the labeled dataset and refining the model."
              },
              {
                q: "Q10: Have we done hyperparameter tuning?",
                a: "Not explicitly. The pipeline uses ElasticNet or L1 regularization, but there's no mention of grid search, randomized search, or Bayesian optimization for hyperparameter tuning. If tuning is desired, you could integrate GridSearchCV or Optuna into the pipeline builder section."
              },
              {
                q: "Q11: What is a realistic accuracy target?",
                a: "You're already at 86% accuracy, which is strong depending on class balance, business impact, and calibration. If your model is well-calibrated (via Platt scaling) and meets coverage guarantees (via conformal prediction), then 86% is realistic and potentially sufficient. You might aim for 88-90% if the domain allows, but gains beyond that may require better features, more labeled data, or model ensemble/tuning."
              }
            ].map((item, idx) => {
              const [open, setOpen] = useState(false);
              return (
                <div
                  key={idx}
                  className="border border-white/10 rounded-xl bg-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex justify-between items-center px-4 py-3 text-left text-sm font-medium hover:bg-white/10"
                  >
                    <span>{item.q}</span>
                    <span className="ml-2">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <div className="px-4 pb-3 text-sm text-white/70 whitespace-pre-line">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
