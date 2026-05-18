// Dynamically imported to keep TF.js out of the initial bundle.
// The model singleton lives at module scope so it loads only once per session.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getModel(): Promise<any> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [tf, use] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/universal-sentence-encoder"),
      ]);
      await tf.ready();
      return use.load();
    })();
  }
  return modelPromise;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type CatCorrection = { task: string; category: string };

export async function suggestCategoryUSE(
  taskName: string,
  categories: string[],
  corrections: CatCorrection[],
): Promise<string | null> {
  const model = await getModel();

  const correctionTasks = corrections.map((c) => c.task);
  // Embed task name + category labels + past correction task strings all at once
  const allTexts = [taskName, ...categories, ...correctionTasks];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tensor: any = await model.embed(allTexts);
  const vecs: number[][] = tensor.arraySync();
  tensor.dispose();

  const taskVec = vecs[0];
  const catVecs = vecs.slice(1, 1 + categories.length);
  const corrVecs = vecs.slice(1 + categories.length);

  // Per-category centroid: average of (category label embedding + embeddings of
  // past corrections assigned to that category). More corrections → better signal.
  const best = categories
    .map((cat, i) => {
      const corrForCat = corrections
        .map((c, j) => ({ cat: c.category, vec: corrVecs[j] }))
        .filter((c) => c.cat === cat)
        .map((c) => c.vec);

      const group = [catVecs[i], ...corrForCat];
      const centroid = catVecs[i].map((_, d) =>
        group.reduce((s, v) => s + v[d], 0) / group.length,
      );

      return { cat, sim: cosineSim(taskVec, centroid) };
    })
    .reduce((a, b) => (a.sim > b.sim ? a : b));

  // Threshold guards against forcing a category when nothing is relevant
  return best.sim > 0.35 ? best.cat : null;
}
