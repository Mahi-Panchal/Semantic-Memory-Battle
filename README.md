# 🧠 WordMind — Semantic Memory Battle

**Think fast. Connect meaning. Outsmart the AI.**

WordMind is a browser-based Natural Language Processing (NLP) game where players compete against AI opponents by discovering semantically related words under time pressure. Instead of relying on simple spelling matches, WordMind uses **sentence embeddings and cosine similarity** to evaluate the meaning-relatedness of words.

Built with **HTML, CSS, JavaScript, and Transformers.js**, the game runs its NLP inference directly in the browser without requiring a backend server or API key.

🔗 **Live Demo:** [Play WordMind](YOUR_GITHUB_PAGES_URL)
📂 **Repository:** [View Source Code](YOUR_GITHUB_REPOSITORY_URL)

---

## ✨ Key Features

* 🧠 **Semantic Word Matching:** Uses transformer-based embeddings to measure semantic similarity rather than just comparing characters.
* 🤖 **AI Opponents:** Compete against computer-controlled players that search a vocabulary for qualifying words.
* ⚡ **Real-Time Similarity Scoring:** Evaluates submitted words using cosine similarity and a configurable difficulty threshold.
* ⏱️ **Timed Battles:** Choose from multiple turn durations and make connections before time runs out.
* ❤️ **Lives and Elimination:** Failed attempts, duplicate words, and timeouts cost lives.
* 💡 **Smart Hints:** Reveal the first two letters of a valid word once per game.
* 🔍 **Live Similarity Preview:** Get feedback on how closely your word relates to the current word while typing.
* 🔗 **Word Chain Visualization:** Track connections with color-coded similarity levels and a PCA-based visualization.
* 📊 **NLP Evaluation Lab:** Evaluate semantic similarity predictions using labeled word pairs and standard classification metrics.
* 🌐 **Browser-Based Inference:** Run the NLP pipeline locally using Transformers.js and ONNX model weights.
* 📱 **Responsive Interface:** Designed to work across desktop and mobile screens.

---

## 🎮 How to Play

1. Start a game and choose your difficulty level.
2. Read the current word displayed in the battle arena.
3. Enter one English word that is semantically related to it.
4. Your word is converted into an embedding and compared with the current word.
5. If its cosine similarity meets the selected threshold, your word is accepted.
6. Continue making valid connections before the timer expires.
7. Avoid repeated words, including supported inflected forms such as *run/running* and *mouse/mice*.
8. Eliminate all AI opponents while keeping at least one life remaining to win.

### Difficulty Levels

| Mode   | Minimum cosine similarity |
| ------ | ------------------------: |
| Easy   |                      0.35 |
| Normal |                      0.42 |
| Hard   |                      0.50 |
| Custom |                 0.20–0.80 |

The selected similarity threshold is locked when a game starts, ensuring consistent evaluation throughout the match.

---

## 🧠 NLP Architecture

WordMind uses a pretrained transformer model to represent words as dense numerical vectors. These vectors allow the game to compare semantic relationships computationally.

### 1. Pretrained Sentence Embeddings

**Model:** `Xenova/all-MiniLM-L6-v2`

The model generates 384-dimensional embeddings. Semantically related text can have similar vector representations, allowing the game to evaluate relationships beyond literal character overlap.

### 2. Cosine Similarity

Cosine similarity measures the angle-based similarity between two vectors.

For embeddings \(A\) and \(B\):

$$
\operatorname{sim}(A,B)=
\frac{A\cdot B}{\|A\|\|B\|}
$$

The calculated score is compared with the difficulty threshold.

**Example:**

Suppose the current word is `doctor` and the player enters `hospital`. If their similarity score meets the selected threshold, the word is accepted.

The important distinction is that the model estimates semantic similarity; it does not guarantee that two words are logically related in every context.

### 3. Browser-Based Inference

WordMind uses Transformers.js to execute the model in the browser, with WebAssembly or WebGPU support depending on the environment.

The model weights are downloaded when needed and cached by the browser where supported.

**Benefits:**

* No dedicated inference server.
* No API key required.
* No per-request external AI API calls.
* Reduced need to transmit player inputs to a backend.
* Potential offline operation after model assets have been cached, subject to browser and caching limitations.

### 4. Vocabulary Warm-Up and Caching

Before a match begins, WordMind generates and caches embeddings for approximately 1,500 vocabulary words.

The process runs in batches of 25 words and yields periodically to help maintain interface responsiveness.

The Start Game button remains disabled until warm-up completes, so the AI has a prepared vocabulary for its turn.

### 5. AI Opponent Strategy

The AI searches the unused vocabulary for words whose similarity scores meet the same threshold used to judge the human player.

Its selection process is:

1. Calculate similarity between the current word and unused vocabulary words.
2. Filter out words below the selected threshold.
3. Rank qualifying words by similarity.
4. Select a random word from a pool of high-scoring candidates.
5. Introduce a short delay to simulate thinking.

This combines semantic search with randomized candidate selection, making the opponent less predictable than one that always selects the highest-scoring word.

---

## 📊 NLP Evaluation Lab

WordMind includes an evaluation suite for examining how well the embedding model distinguishes related word pairs from unrelated ones.

### Evaluation Dataset

* **65 manually labeled word pairs**
* 43 related pairs
* 22 unrelated pairs
* Includes antonyms, polysemous words, and difficult boundary cases

The dataset is intentionally not balanced, so accuracy should be interpreted alongside the other evaluation metrics.

### Evaluation Metrics

| Metric    | What it measures                                               |
| --------- | -------------------------------------------------------------- |
| Accuracy  | Overall proportion of correct predictions                      |
| Precision | Proportion of predicted-related pairs that are labeled related |
| Recall    | Proportion of labeled-related pairs correctly identified       |
| F1-score  | Harmonic mean of precision and recall                          |

The evaluation suite tests thresholds from **0.20 to 0.70 in increments of 0.05** and highlights the threshold with the best F1-score.

### Character-Level Baseline

A character-level Jaccard similarity baseline provides a comparison with a simple lexical similarity method.

This baseline is used for evaluation only; it does not determine whether words are accepted during gameplay.

Comparing the two approaches helps illustrate the difference between character overlap and embedding-based semantic similarity.

**Important:** The evaluation dataset is small and manually labeled. Its results are useful for a prototype-level comparison, not proof of general performance across English vocabulary.

---

## 🛠️ Technology Stack

| Technology           | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| HTML5                | Game structure and interface                         |
| CSS3                 | Styling, responsive layout, and visual feedback      |
| JavaScript           | Game logic, state management, and AI decision-making |
| Transformers.js      | Browser-based transformer inference                  |
| MiniLM-L6-v2         | Semantic embedding generation                        |
| ONNX                 | Model inference representation                       |
| WebAssembly / WebGPU | Browser inference execution                          |
| Cosine Similarity    | Semantic similarity scoring                          |
| PCA                  | Two-dimensional visualization of word embeddings     |
| GitHub Pages         | Static website hosting                               |

---

## 📁 Project Structure

```text
WordMind/
├── index.html       # Lobby, game arena, and settings modals
├── style.css        # Responsive dark-themed interface
├── script.js        # NLP pipeline, game engine, AI, and evaluation
├── vocab.js         # Vocabulary used by AI opponents
├── eval-pairs.js    # Labeled evaluation dataset
└── README.md        # Project documentation
```

---

## 🚀 Run Locally

### Prerequisites

* A modern web browser.
* Python 3 or Node.js.
* Internet access for the initial model download.

### Option 1: Python

Open a terminal in the project directory and run:

```bash
python -m http.server 8000
```

Open the following address in your browser:

```text
http://localhost:8000
```

### Option 2: Node.js

Run:

```bash
npx serve .
```

Open the local URL displayed in the terminal.

### Option 3: VS Code

1. Open the project folder in VS Code.
2. Install the Live Server extension if necessary.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

**Note:** Serve the project over HTTP rather than opening `index.html` directly using `file://`, because the dynamic module loading and browser model pipeline require a suitable web-serving environment.

---

## 🌐 Deploy to GitHub Pages

1. Create a GitHub repository for WordMind.
2. Upload the six project files to the repository root.
3. Open **Settings → Pages**.
4. Select deployment from the `main` branch and the `/ (root)` directory.
5. Save the settings and wait for deployment.
6. Open the published website using the URL provided by GitHub Pages.

Replace the Live Demo and Repository placeholders at the top of this README with your actual links after deployment.

---

## 🔒 Privacy and Performance

WordMind performs its game logic and model inference in the browser. It does not require a custom backend or an external inference API.

The model must generally be downloaded before first use, so initial loading time depends on network speed and browser capabilities. Subsequent loading may be faster because assets can be cached.

Actual offline availability depends on whether all required model assets and dependencies have been cached successfully. The game should not be described as guaranteed to work offline on every browser.

---

## 🎯 Project Objectives

WordMind explores how pretrained language models can be integrated into an interactive application to make semantic relationships measurable and playable.

The project demonstrates:

* Applying transformer-based embeddings to an interactive NLP problem.
* Using vector similarity for semantic matching.
* Building a vocabulary-based nearest-neighbor search strategy.
* Designing threshold-based difficulty levels.
* Comparing embedding-based similarity against a lexical baseline.
* Evaluating binary classification using precision, recall, accuracy, and F1-score.
* Running machine-learning inference in a browser without a dedicated backend.

---

## 🔮 Future Improvements

* Expand the labeled evaluation dataset to improve reliability.
* Add contextual sentences to distinguish different meanings of polysemous words.
* Introduce semantic categories and difficulty-adaptive challenges.
* Improve lemmatization and duplicate detection.
* Optimize embedding storage and vocabulary search performance.
* Add multiplayer support for real human opponents.
* Compare different embedding models using the same evaluation dataset.

---

## 👨‍💻 About the Project

**WordMind — Semantic Memory Battle** is an NLP-focused browser game that combines semantic embeddings, similarity-based decision-making, AI opponents, and model evaluation in one interactive experience.

Rather than treating word association as a simple string-matching problem, WordMind explores how a pretrained language model can represent relationships between words as numerical vectors and use those representations to power gameplay.

**Core concept:** Turning semantic similarity into a competitive, measurable, and interactive NLP experience.

---

*Built with JavaScript, Transformers.js, and a curiosity for Natural Language Processing.*
