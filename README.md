# 🧠 WordMind — Client-Side Semantic Battle & Edge NLP Engine

> **A high-precision, zero-backend NLP word-association game & empirical semantic benchmark suite running entirely in the browser via WebAssembly ONNX embeddings.**

Designed with **edge transformer inference**, **sub-millisecond vector math**, **custom Power-Iteration PCA projection**, **morphological lemmatization**, and an **interactive NLP evaluation lab**.

---

[Explore Features](#-key-engineering-features) • [System Architecture](#-nlp-system-architecture--metrics) • [Engineering Highlights](#-engineering--architectural-highlights) • [NLP Benchmark Lab](#-empirical-nlp-benchmark-suite) • [Quickstart](#-getting-started) • [Repository Structure](#-repository-structure) • [Roadmap](#-roadmap--future-enhancements)

---

## 📌 Executive Summary

**WordMind** is an adversarial semantic association game and NLP testbench engineered to run state-of-the-art transformer models client-side with **zero server dependencies and zero API keys**. 

Powered by **Transformers.js** and the quantized **`Xenova/all-MiniLM-L6-v2`** model, WordMind computes 384-dimensional dense semantic embeddings directly inside the browser's WebAssembly / WebGPU runtime. Players compete against autonomous AI agents by submitting semantically coherent words whose cosine similarity meets strict, mathematically verifiable thresholds in real time.

Beyond gameplay, WordMind integrates an **in-browser NLP Evaluation Suite** benchmarking ground-truth word pairs across precision, recall, and F1-score curves against baseline n-gram / Jaccard models, complete with real-time 2D semantic trajectory mapping via custom **Power-Iteration Principal Component Analysis (PCA)**.

---

## 🚀 Key Engineering Features

- ⚡ **100% Client-Side Edge NLP**: Direct ONNX runtime execution (~23 MB quantized model) compiled for WebAssembly with browser-native caching (`Cache API / IndexedDB`) for offline capability.
- 📐 **High-Precision 384-D Vector Mathematics**: Real-time IEEE 754 floating-point cosine similarity evaluations (`dot(A, B) / (‖A‖ ‖B‖)`) with instant response times (<1ms per pair post-warmup).
- 🔄 **Non-Blocking Cooperative Warm-up**: Asynchronous batched caching (~1,500 words in 25-word chunks) with cooperative UI event-loop yields (`setTimeout(0)`), ensuring 60 FPS responsiveness during initial weight indexing.
- 🤖 **Autonomous Heuristic AI Agents**: Nearest-neighbor vector retrieval filtering out duplicates and inflected derivatives, sampling from dynamic probability quantiles (top 25%) to simulate realistic human-AI turn play.
- 🧬 **Morphological Lemmatizer & Suffix Stripper**: Custom inflection engine normalizing plurals (`-ies`, `-ves`, `-es`, `-s`), tense inflections (`-ing`, `-ed`, gemination), and irregular roots (`mouse` ↔ `mice`, `run` ↔ `ran`) with exception guarding (`news`, `chaos`, `lens`).
- 📊 **Real-Time 2D Semantic Projection**: In-house Power-Iteration PCA engine projecting high-dimensional word vectors onto an HTML5 Canvas, visualizing semantic drift and trajectory clusters across game rounds.
- 🧪 **Built-in NLP Evaluation Lab**: Empirical testbed evaluating 65 ground-truth pairs across variable similarity thresholds ($\tau \in [0.20, 0.80]$), calculating confusion matrices (Precision, Recall, F1) with instant CSV report generation.
- 🔊 **Zero-Asset Web Audio Synthesizer**: Procedural acoustic feedback using standard Web Audio API oscillators and gain envelopes without external `.mp3` or `.wav` dependencies.

---

## 📊 NLP System Architecture & Metrics

### 1. Difficulty & Similarity Gating Matrix

| Difficulty Tier | Cosine Gate ($\tau$) | Target Acceptance Criteria | AI Candidate Selection Pool |
| :--- | :---: | :--- | :--- |
| **Easy** | $\ge 0.35$ | Broad contextual/thematic link (*e.g., Ocean → Water*) | Top 25 candidates, wide exploratory variance |
| **Normal** | $\ge 0.42$ | Moderate direct association (*e.g., Planet → Orbit*) | Top 15 candidates, balanced semantic focus |
| **Hard** | $\ge 0.50$ | Tight hypernym/synonym bond (*e.g., Doctor → Surgeon*) | Top 5 candidates, highly constrained search |
| **Custom** | $0.20 - 0.80$ | User-defined mathematical threshold (locked per session) | Dynamically scaled quantile $\lceil 0.25 \cdot \|S\| \rceil$ |

---

## 🏗️ Engineering & Architectural Highlights

### 1. Edge NLP Inference & Execution Pipeline

```
  ┌───────────────────────────────────────────────────────────┐
  │                    User / AI Word Input                   │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │         Morphological Normalizer & Lemmatizer             │
  │     (Inflection Stripping, Irregular Map, Root Guard)     │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │             In-Memory Vector Cache (Map<w, vec>)          │
  │        Hit ──► Fast Path (O(1))                           │
  │        Miss ──► ONNX WebAssembly Pipeline (all-MiniLM-L6) │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │         384-D Dense Embedding (Mean-Pooled, L2-Norm)      │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │               Cosine Similarity Engine (IEEE 754)         │
  │             score = Σ(a_i * b_i) / (||a|| * ||b||)        │
  └──────────────┬─────────────────────────────┬──────────────┘
                 │                             │
                 ▼                             ▼
  ┌─────────────────────────────┐┌────────────────────────────┐
  │   Threshold Gate (score ≥ τ)││   Power-Iteration 2D PCA   │
  │   Pass: Advance & Chain Log ││   Canvas Semantic Drift    │
  │   Fail: Deduct Life & Hints ││   Trajectory Plotter       │
  └─────────────────────────────┘└────────────────────────────┘
```

### 2. Cooperative Asynchronous Vocabulary Warm-up
Embedding ~1,500 vocabulary words synchronously on the main thread would freeze the browser for 2–5 seconds. WordMind solves this through a cooperative yielding loop:

```javascript
// Non-blocking batched ingestion pipeline
const total = VOCABULARY.length;
for (let i = 0; i < total; i += CFG.WARMUP_BATCH) {
  const batch = VOCABULARY.slice(i, i + CFG.WARMUP_BATCH);
  await Promise.all(batch.map(w => embed(w)));
  
  // Yield execution back to the browser event loop for 60 FPS animation
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### 3. Nearest-Neighbor Heuristic AI Agent
Rather than hardcoded response trees, AI opponents execute a vectorized nearest-neighbor search over the cached vocabulary space:

$$\text{Candidates} = \Big\{ w \in \mathcal{V} \setminus \mathcal{U} \;\Big|\; \cos\big(\mathbf{v}_{\text{current}}, \mathbf{v}_w\big) \ge \tau \Big\}$$

The agent sorts candidates descending by score and samples from the top quartile pool $\min(25, \max(5, \lceil 0.25 \cdot |\text{Candidates}| \rceil))$, introducing natural variance while preventing deterministic play.

### 4. Custom Power-Iteration 2D PCA Projection
To visualize semantic relationships without heavy linear algebra libraries, WordMind includes a pure JavaScript implementation of **Principal Component Analysis** using power iteration with Gram-Schmidt orthogonalization:

```javascript
// Mean-centering the n × 384 embedding matrix
const mean = new Array(d).fill(0);
X.forEach(row => row.forEach((v, j) => mean[j] += v / n));
const C = X.map(row => row.map((v, j) => v - mean[j]));

// Power Iteration to extract first principal component
function powerIter(mat, iters = 50) {
  let v = new Array(d).fill(0).map((_, k) => Math.sin(k * 12.9898 + 1.0));
  for (let it = 0; it < iters; it++) {
    const proj = mat.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
    const result = new Array(d).fill(0);
    mat.forEach((row, i) => row.forEach((x, j) => result[j] += proj[i] * x));
    const norm = Math.sqrt(result.reduce((s, x) => s + x * x, 0));
    v = result.map(x => x / (norm || 1));
  }
  return v;
}
```

---

## 🧪 Empirical NLP Benchmark Suite

The built-in **NLP Lab** runs exhaustive evaluation tests against hand-curated challenging word pairs (synonyms, co-hyponyms, polysemous terms, and hard antonym negatives):

$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}} \qquad \text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}} \qquad \text{F}_1 = \frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### Empirical Benchmark Sample (65 Labeled Word Pairs)

| Threshold ($\tau$) | Accuracy | Precision | Recall | Transformer $F_1$ | Jaccard Baseline $F_1$ |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0.25** | 71% | 68% | 100% | **0.81** | 0.42 |
| **0.35** | 83% | 82% | 95% | **0.88** | 0.38 |
| **0.42 (Optimal)** | **89%** | **91%** | **91%** | **0.91** | 0.31 |
| **0.50** | 82% | 97% | 74% | **0.84** | 0.22 |
| **0.60** | 68% | 100% | 49% | **0.66** | 0.14 |

*Features one-click CSV export (`wordmind_eval.csv`) for external data science validation in Python/Pandas.*

---

## 💻 Getting Started

### Prerequisites
Any modern browser supporting **WebAssembly** and **ES6 Modules** (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+).

### Local Execution
Because Transformers.js utilizes dynamic `import()` statements and Web Workers, the application must be served over HTTP(S):

#### Option A: Python (Built-in)
```bash
# Clone the repository
git clone https://github.com/your-username/nlp_game.git
cd nlp_game/game

# Run local HTTP server
python -m http.server 8000
```
*Open `http://localhost:8000` in your browser.*

#### Option B: Node.js
```bash
npx serve game
# or
npx http-server game -p 8000
```

#### Option C: VS Code Live Server
Right-click `game/index.html` and select **"Open with Live Server"**.

---

## 🖥️ UI & Gameplay Demonstration

```
┌────────────────────────────────────────────────────────────────────────┐
│  WORDMIND  [Model: Xenova/all-MiniLM-L6-v2] [Status: Ready ●]  ⚙ Lab   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   CURRENT WORD:   A S T R O N A U T                                    │
│   Round 4  •  Threshold: ≥ 0.42  •  Time: 12s                          │
│                                                                        │
│   [ Chain ]: EARTH (1.00) ──► ROCKET (0.58) ──► GALAXY (0.51) ──► ...  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Your Input: [ SATELLITE                    ]  [ Submit ]       │   │
│   │ Live Gauge: 0.54 — Close enough (Pass)                         │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ROSTER:                                                              │
│   👤 You        ♥♥   [Active Turn]                                     │
│   🌌 Nova-7     ♥♥   Waiting...                                        │
│   ⚡ CyberSage  ♥    Waiting...                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
nlp_game/
├── game/
│   ├── index.html        # Semantic HTML5 arena, modals, and NLP Lab dashboard
│   ├── style.css         # Responsive glassmorphic dark theme & animations
│   ├── script.js         # Core game loop, Transformers.js pipeline, PCA, audio
│   ├── vocab.js          # Indexed 1,500+ word dictionary for AI opponent search
│   ├── eval-pairs.js     # 65 Ground-truth annotated semantic evaluation dataset
│   └── README.md         # Game-specific guide
├── README.md             # Project documentation & engineering overview
└── LICENSE               # MIT Open Source License
```

---

## 📈 Roadmap & Future Enhancements

- [ ] **WebGPU Acceleration**: Direct WebGPU backend pipeline for sub-10ms batch embedding acceleration on mobile devices.
- [ ] **Custom Fine-Tuned LoRA Adapter**: Fine-tune domain-specific embeddings for specialized gaming modes (Scientific, Medical, Mythology).
- [ ] **WebRTC Multiplayer**: Real-time peer-to-peer battle rooms with state synchronization over DataChannels.
- [ ] **Vector Space t-SNE / UMAP**: Alternative high-dimensional manifold projection algorithms running in Web Workers.

---

## 👨‍💻 Author & Contributions

Mahi Panchal
- **GitHub**: https://github.com/Mahi-Panchal/Semantic-Memory-Battle
- **LinkedIn**: www.linkedin.com/in/mahi-panchal-26344931a

Jiya Vyas

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE] file for details.
