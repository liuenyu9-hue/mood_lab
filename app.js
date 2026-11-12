
const quizFiles = [
  "dessert-personality.json",
  "animal-personality.json",
  "magic-world.json"
];

const quizList = document.getElementById("quiz-list");
const quizPlayer = document.getElementById("quiz-player");
const quizSection = document.getElementById("quizzes");

let quizzes = [];
let currentQuiz = null;
let questionIndex = 0;
let answers = [];

async function loadQuizzes() {
  try {
    const responses = await Promise.all(
      quizFiles.map(file => fetch("./quizzes/" + file))
    );

    if (responses.some(response => !response.ok)) {
      throw new Error("找不到測驗資料");
    }

    quizzes = await Promise.all(
      responses.map(response => response.json())
    );

    showQuizList();
  } catch (error) {
    quizList.textContent = "測驗資料尚未建立，請稍後再試。";
    console.error(error);
  }
}

function showQuizList() {
  quizSection.hidden = false;
  quizPlayer.hidden = true;
  quizList.innerHTML = "";

  quizzes.forEach(quiz => {
    const card = document.createElement("article");
    card.className = "quiz-card";

    const title = document.createElement("h3");
    title.textContent = quiz.title;

    const description = document.createElement("p");
    description.textContent = quiz.description;

    const button = document.createElement("button");
    button.textContent = "開始測驗 ♡";
    button.addEventListener("click", () => startQuiz(quiz));

    card.append(title, description, button);
    quizList.appendChild(card);
  });
}

function startQuiz(quiz) {
  currentQuiz = quiz;
  questionIndex = 0;
  answers = Array(quiz.questions.length).fill(null);

  quizSection.hidden = true;
  quizPlayer.hidden = false;
  showQuestion();
  quizPlayer.scrollIntoView({ behavior: "smooth" });
}

function showQuestion() {
  const question = currentQuiz.questions[questionIndex];
  const total = currentQuiz.questions.length;

  quizPlayer.innerHTML = "";

  const progress = document.createElement("p");
  progress.textContent = `第 ${questionIndex + 1} 題 / 共 ${total} 題`;

  const bar = document.createElement("div");
  bar.className = "progress-bar";

  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = `${((questionIndex + 1) / total) * 100}%`;
  bar.appendChild(fill);

  const title = document.createElement("h2");
  title.textContent = question.text;

  quizPlayer.append(progress, bar, title);

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = option.text;

    if (answers[questionIndex] === index) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      answers[questionIndex] = index;
      showQuestion();
    });

    quizPlayer.appendChild(button);
  });

  const previous = document.createElement("button");
  previous.textContent = "上一題";
  previous.disabled = questionIndex === 0;
  previous.addEventListener("click", () => {
    questionIndex--;
    showQuestion();
  });

  const next = document.createElement("button");
  next.textContent =
    questionIndex === total - 1 ? "查看結果 ✨" : "下一題";

  next.disabled = answers[questionIndex] === null;

  next.addEventListener("click", () => {
    if (questionIndex === total - 1) {
      showResult();
    } else {
      questionIndex++;
      showQuestion();
    }
  });

  quizPlayer.append(previous, next);
}

function showResult() {
  const scores = Object.fromEntries(
    currentQuiz.results.map(result => [result.id, 0])
  );

  currentQuiz.questions.forEach((question, index) => {
    const option = question.options[answers[index]];
    scores[option.result]++;
  });

  const winner = currentQuiz.results.reduce((best, result) =>
    scores[result.id] > scores[best.id] ? result : best
  );

  quizPlayer.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "✨ 你的測驗結果 ✨";

  const name = document.createElement("h3");
  name.textContent = winner.title;

  const description = document.createElement("p");
  description.textContent = winner.description;

  const retry = document.createElement("button");
  retry.textContent = "重新測驗";
  retry.addEventListener("click", () => startQuiz(currentQuiz));

  const home = document.createElement("button");
  home.textContent = "返回首頁";
  home.addEventListener("click", showQuizList);

  const share = document.createElement("button");
  share.textContent = "複製結果";
  share.addEventListener("click", async () => {
    const text = `${currentQuiz.title}\n${winner.title}\n${winner.description}`;
    try {
      await navigator.clipboard.writeText(text);
      share.textContent = "已複製！";
    } catch {
      share.textContent = "複製失敗，請手動複製";
    }
  });

  quizPlayer.append(
    heading, name, description, retry, home, share
  );
}

loadQuizzes();
