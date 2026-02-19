/* ===============================
   DOM
================================= */

const input = document.querySelector("#input");
const renderButton = document.querySelector("#button");
const clearButton = document.querySelector("#clearButton");
const downloadAllButton = document.querySelector("#allButton");
const count = document.querySelector("#count");

const progressText = document.querySelector("#progressText");
const byteInfo = document.querySelector("#byteInfo");
const foundInfo = document.querySelector("#foundInfo");
const box = document.querySelector("#imgBox");

/* ===============================
   STATE
================================= */

let preparedFiles = [];
const urls = [];
let worker = null;
let isProcessing = false;

/* ===============================
   WORKER MANAGEMENT
================================= */

function createWorker() {
  const worker = new Worker("worker.js");

  worker.addEventListener("message", (event) => {
    const data = event.data;

    if (data.type === "progress") {
        progressText.textContent = data.percent + "%";
        byteInfo.textContent =
        data.processedBytes.toLocaleString() +
        " / " +
        data.totalBytes.toLocaleString() +
        " bytes";

        foundInfo.textContent = "Found: " + data.found;
    }

    if (data.type === "found") {
        foundInfo.textContent = "Found: " + data.count;

        preparedFiles.push(data.file);

        // 🔥 РЕНДЕР ОДРАЗУ
        renderSingleImage(data.file, data.count - 1);
    }

    if (data.type === "done") {
        toggleButtons(true);
        stopButton.classList.add("disable");
        isProcessing = false;
    }

    if (data.type === "error") {
        console.error("Worker error:", data.message);
        toggleButtons(true);
        stopButton.classList.add("disable");
        isProcessing = false;
    }
  });


  return worker;
}

/* ===============================
   UI HELPERS
================================= */

function renderSingleImage(fileBytes, index) {
  const blob = new Blob([fileBytes], {
    type: "image/png",
  });

  const url = URL.createObjectURL(blob);
  urls.push(url);

  const imgName = `unpackedImg_${index}_${createHash()}`;

  const img = document.createElement("img");
  img.src = url;
  img.alt = imgName;
  img.title = imgName;
  img.className = "img";

  img.addEventListener("click", () => {
    downloadURL(url, imgName);
  });

  box.appendChild(img);
}


function toggleButtons(enable) {
  [renderButton, downloadAllButton, clearButton].forEach((btn) =>
    btn.classList.toggle("disable", !enable)
  );
}

function createHash(length = 4) {
  const letters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let hash = "";

  for (let i = 0; i < length; i++) {
    hash += letters[Math.floor(Math.random() * letters.length)];
  }

  return hash;
}

function downloadURL(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function clearImages() {
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls.length = 0;
  box.innerHTML = "";
  preparedFiles = [];
  count.textContent = "0";
}

/* ===============================
   RENDER
================================= */

function renderImages() {
  preparedFiles.forEach((fileBytes, index) => {
    const blob = new Blob([fileBytes], {
      type: "image/png",
    });

    const url = URL.createObjectURL(blob);
    urls.push(url);

    const imgName = `unpackedImg_${index}_${createHash()}`;

    const img = document.createElement("img");
    img.src = url;
    img.alt = imgName;
    img.title = imgName;
    img.className = "img";

    img.addEventListener("click", () => {
      downloadURL(url, imgName);
    });

    box.appendChild(img);
  });
}

function downloadAll() {
  urls.forEach((url, i) => {
    setTimeout(() => {
      downloadURL(url, `file_${i}_${createHash()}`);
    }, i * 200);
  });
}

/* ===============================
   STOP BUTTON
================================= */

const stopButton = document.createElement("button");
stopButton.textContent = "Stop";
stopButton.classList.add("disable");
document.body.appendChild(stopButton);

stopButton.addEventListener("click", () => {
  if (worker && isProcessing) {
    worker.terminate();
    worker = null;
    isProcessing = false;

    progressText.textContent += " (stopped)";
    stopButton.classList.add("disable");

    // 🔥 ГОЛОВНЕ ВИПРАВЛЕННЯ
    if (preparedFiles.length > 0) {
      toggleButtons(true);
    } else {
      toggleButtons(false);
    }

    console.log("Worker terminated");
  }
});


/* ===============================
   FILE INPUT
================================= */

function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (worker) {
    worker.terminate();
  }

  worker = createWorker();
  isProcessing = true;

  toggleButtons(false);
  stopButton.classList.remove("disable");

  progressText.textContent = "0%";
  byteInfo.textContent = "0 / 0 bytes";
  foundInfo.textContent = "Found: 0";

  const reader = new FileReader();

  reader.addEventListener("load", (e) => {
    const buffer = e.target.result;

    worker.postMessage(
      { buffer, type: "png" },
      [buffer]
    );
  });

  reader.readAsArrayBuffer(file);
}

/* ===============================
   EVENTS
================================= */

input.addEventListener("change", handleFileInput);
renderButton.addEventListener("click", renderImages);
clearButton.addEventListener("click", clearImages);
downloadAllButton.addEventListener("click", downloadAll);
