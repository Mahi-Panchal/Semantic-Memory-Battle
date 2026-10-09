<div align="center">

# 🧠 WordMind — Semantic Memory Battle
### *Edge NLP Word-Association Arena & Empirical Semantic Benchmark Suite*

<p align="center">
  A high-performance, zero-backend semantic battle game and NLP evaluation suite powered by 384-dimensional transformer embeddings running 100% client-side via WebAssembly.
</p>

<!-- Tech Stack & Architecture Badges (for-the-badge style) -->
<p align="center">
  <img src="https://img.shields.io/badge/TRANSFORMERS.JS-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Transformers.js" />
  <img src="https://img.shields.io/badge/ONNX%20RUNTIME%20WEB-005CED?style=for-the-badge&logo=onnx&logoColor=white" alt="ONNX Runtime Web" />
  <img src="https://img.shields.io/badge/WEBASSEMBLY-654FF0?style=for-the-badge&logo=webassembly&logoColor=white" alt="WebAssembly" />
  <img src="https://img.shields.io/badge/JAVASCRIPT%20ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript ES6+" />
  <img src="https://img.shields.io/badge/HTML5%20%2F%20CSS3-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5 / CSS3" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/all--MiniLM--L6--v2-384--D%20DENSE-8B5CF6?style=for-the-badge&logo=openai&logoColor=white" alt="MiniLM-L6-v2" />
  <img src="https://img.shields.io/badge/2D%20PCA%20ENGINE-POWER%20ITERATION-059669?style=for-the-badge&logo=diagramsdotnet&logoColor=white" alt="Power Iteration PCA" />
  <img src="https://img.shields.io/badge/WEB%20AUDIO%20API-PROCEDURAL-0284C7?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/ZERO%20BACKEND-100%25%20CLIENT--SIDE-10B981?style=for-the-badge&logo=fastapi&logoColor=white" alt="Zero Backend" />
  <img src="https://img.shields.io/badge/LICENSE-MIT-22C55E?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="MIT License" />
</p>

<br />

[✨ Key Features](#-key-engineering-features) • [🏛️ System Architecture](#-system-architecture--inference-pipeline) • [🧮 Vector Math & PCA](#-vector-mathematics--pca-projection) • [🧪 NLP Evaluation Lab](#-empirical-nlp-benchmark-suite) • [🚀 Quickstart](#-getting-started) • [📂 Project Structure](#-repository-structure)

---

</div>

## 📌 Executive Overview

**WordMind** is an adversarial semantic association game and NLP laboratory engineered to run state-of-the-art transformer models directly in the user's browser with **zero server dependencies, zero latency roundtrips, and zero API keys**.

Powered by **Transformers.js** and the quantized **`Xenova/all-MiniLM-L6-v2`** model (~23 MB ONNX weights), WordMind computes 384-dimensional dense semantic embeddings inside the browser's WebAssembly environment. Players compete against autonomous AI agents by submitting semantically coherent words whose cosine similarity meets strict mathematical thresholds in real time.

Beyond gameplay, WordMind integrates an **in-browser NLP Evaluation Suite** that benchmarks ground-truth word pairs across precision, recall, and F1-score curves against baseline n-gram / Jaccard algorithms, complete with real-time 2D semantic trajectory mapping via custom **Power-Iteration Principal Component Analysis (PCA)**.

---

## 🚀 Key Engineering Features

- ⚡ **100% Client-Side Edge NLP**: Direct ONNX runtime execution compiled for WebAssembly with browser-native caching (`Cache API / IndexedDB`) for complete offline operation after initial weight load.
- 📐 **Sub-Millisecond 384-D Vector Math**: High-speed IEEE 754 floating-point cosine similarity evaluations ($< 1\text{ms}$ per word pair post-warmup) using normalized dot products.
- 🔄 **Cooperative Asynchronous Vocabulary Warm-up**: Non-blocking batched ingestion (~1,500 words in 25-word chunks) yielding execution to the browser event loop (`setTimeout(0)`), ensuring a locked 60 FPS UI during pre-indexing.
- 🤖 **Autonomous Vector-Search AI Agents**: Nearest-neighbor candidate retrieval filtering out duplicates and morphological derivatives, sampling from dynamic probability quantiles (top 25%) to simulate human-like gameplay.
- 🧬 **Morphological Lemmatizer & Suffix Stripper**: Custom inflection engine normalizing plurals (`-ies`, `-ves`, `-es`, `-s`), verb tenses (`-ing`, `-ed`, gemination), and irregular roots (`mouse` ↔ `mice`, `run` ↔ `ran`) with exception guarding (`news`, `chaos`, `lens`).
- 📊 **Real-Time 2D Semantic Drift Canvas**: Pure JavaScript Power-Iteration PCA engine projecting high-dimensional embeddings onto an HTML5 Canvas, visualizing semantic drift and semantic clusters across game turns.
- 🧪 **Empirical NLP Benchmark Suite**: Testbed evaluating 65 labeled ground-truth word pairs across variable similarity thresholds ($\tau \in [0.20, 0.80]$), calculating confusion matrices (Precision, Recall, F1) with instant CSV report generation.
- 🔊 **Procedural Web Audio Engine**: Synthesizes reactive audio effects (turn chimes, countdown ticks, buzzer alerts, victory fanfares) using Web Audio API oscillators and gain envelopes with zero external audio assets.

---

## 📊 Tech Stack & Architecture Badges

```markdown
<!-- Badges configured with Shields.io "for-the-badge" aesthetic -->
Transformers.js  | ONNX Runtime Web | WebAssembly | JavaScript ES6+ | HTML5 / CSS3
all-MiniLM-L6-v2 | Power-Iteration   | Web Audio   | Zero-Server     | MIT License
```

| Component | Technology | Specification / Role |
| :--- | :--- | :--- |
| **Embeddings Model** | `Xenova/all-MiniLM-L6-v2` | 384-D dense vectors, quantized ONNX (~23MB) |
| **Inference Engine** | Transformers.js (v2) | WebAssembly / Web Workers execution pipeline |
| **Dimensionality Reduction** | Power-Iteration PCA | 2D projection with Gram-Schmidt orthogonalization |
| **Language Normalization** | Rule-Based Lemmatizer | Suffix stripping, irregular mappings, root guarding |
| **Audio Engine** | Web Audio API | Procedural dual-oscillator FM / ADSR synthesis |
| **UI & Styling** | Vanilla HTML5 & CSS3 | Dark-mode glassmorphism, responsive grid layouts |
| **Storage & Cache** | Cache API / IndexedDB | Persistent local caching of ONNX model binaries |

---

## 🏛️ System Architecture & Inference Pipeline

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

---

## 🧮 Vector Mathematics & PCA Projection

### 1. High-Precision Cosine Similarity

Given two 384-dimensional dense word embedding vectors $\mathbf{u}, \mathbf{v} \in \mathbb{R}^{384}$, the semantic association score is computed as:

$$\text{Sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \, \|\mathbf{v}\|_2} = \frac{\sum_{i=1}^{384} u_i v_i}{\sqrt{\sum_{i=1}^{384} u_i^2} \cdot \sqrt{\sum_{i=1}^{384} v_i^2}}$$

### 2. Difficulty & Cosine Gating Matrix

| Difficulty Tier | Cosine Gate ($\tau$) | Target Acceptance Criteria | AI Candidate Selection Pool |
| :--- | :---: | :--- | :--- |
| **Easy** | $\ge 0.35$ | Broad contextual/thematic link (*e.g., Ocean → Water*) | Top 25 candidates, wide exploratory variance |
| **Normal** | $\ge 0.42$ | Moderate direct association (*e.g., Planet → Orbit*) | Top 15 candidates, balanced semantic focus |
| **Hard** | $\ge 0.50$ | Tight hypernym/synonym bond (*e.g., Doctor → Surgeon*) | Top 5 candidates, highly constrained search |
| **Custom** | $0.20 - 0.80$ | User-defined mathematical threshold (slider controlled) | Dynamically scaled quantile $\lceil 0.25 \cdot |S| \rceil$ |

### 3. In-House Power-Iteration 2D PCA Projection

To visualize semantic relationships on an HTML5 canvas without heavy external linear algebra libraries, WordMind uses pure JavaScript Power-Iteration with Gram-Schmidt deflation:

```javascript
// Mean-centering the n × 384 embedding matrix
const mean = new Array(d).fill(0);
X.forEach(row => row.forEach((v, j) => mean[j] += v / n));
const C = X.map(row => row.map((v, j) => v - mean[j]));

// Power Iteration to extract principal components
function powerIteration(mat, iters = 50) {
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

### Empirical Benchmark Results (65 Labeled Word Pairs)

| Threshold ($\tau$) | Accuracy | Precision | Recall | Transformer $F_1$ | Jaccard Baseline $F_1$ |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0.25** | 71% | 68% | 100% | **0.81** | 0.42 |
| **0.35** | 83% | 82% | 95% | **0.88** | 0.38 |
| **0.42 (Optimal)** | **89%** | **91%** | **91%** | **0.91** | 0.31 |
| **0.50** | 82% | 97% | 74% | **0.84** | 0.22 |
| **0.60** | 68% | 100% | 49% | **0.66** | 0.14 |

> 💾 Includes one-click CSV export (`wordmind_eval.csv`) for data science validation in Python, Jupyter, or R.

---

## 🖥️ Interactive Gameplay Interface

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

## 🚀 Getting Started

### Prerequisites
Any modern web browser supporting **WebAssembly** and **ES6 Modules** (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+).

### Local Setup & Execution
Because Transformers.js utilizes dynamic `import()` modules and Web Workers, the application must be served over an HTTP/HTTPS local server:

#### Option 1: Python (Built-in)
```bash
# Clone the repository
git clone https://github.com/your-username/nlp_game.git
cd nlp_game/game

# Start local server
python -m http.server 8000
```
*Open [http://localhost:8000](http://localhost:8000) in your browser.*

#### Option 2: Node.js / npx
```bash
npx serve game
# or
npx http-server game -p 8000
```

#### Option 3: VS Code Live Server
1. Open the `nlp_game` folder in Visual Studio Code.
2. Right-click on [`game/index.html`](file:///c:/Users/DELL/Desktop/nlp_game/game/index.html).
3. Click **"Open with Live Server"**.

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

- [ ] **WebGPU Inference Backend**: Direct WebGPU compute pipeline for sub-10ms batch embedding acceleration on mobile GPUs.
- [ ] **Domain-Specific LoRA Embeddings**: Specialized adapter weights for gaming categories (Biomedical, Pop Culture, History).
- [ ] **WebRTC Multiplayer**: Real-time peer-to-peer arena battles over WebRTC DataChannels.
- [ ] **Dynamic t-SNE / UMAP Worker**: Asynchronous non-linear manifold projection for cluster visualization.

---

## 👨‍💻 Author

**Mahi Panchal**
- GitHub: https://github.com/Mahi-Panchal
- LinkedIn: www.linkedin.com/in/mahi-panchal-26344931a

**Jiya Vyas**
---

## 📄 License

This project is open-source software licensed under the **[MIT License]**.
