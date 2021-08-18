const input = document.querySelector("#input"),
  button = document.querySelector("#button"),
  clearButton = document.querySelector("#clearButton"),
  allButton = document.querySelector("#allButton"),
  count = document.querySelector("#count"),
  box = document.querySelector("#imgBox");

let preparedFiles = []; // Uint8Array[]
const urls = []; //string[]

const buttonChanger = (shodShow) => {
  if (shodShow) {
    button.classList.remove("disable");
    allButton.classList.remove("disable");
    clearButton.classList.remove("disable");
  } else {
    button.classList.add("disable");
    allButton.classList.add("disable");
    clearButton.classList.add("disable");
  }
};

const downloadURL = (data, fileName) => {
  const a = document.createElement("a");
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style.display = "none";
  a.click();
  a.remove();
};

const clearImgs = () => {
  urls.forEach((link) => {
    window.URL.revokeObjectURL(link);
  });
  urls.length = 0;
  box.innerHTML = "";
};

const downloadAll = () => {
  //   const images = document.getElementsByTagName("img");
  let i = 0;

  const interval = setInterval(function () {
    if (urls.length > i) {
      //   window.open(images[i].src, "_blank");
      downloadURL(urls[i], `file_${i}___${createHash()}`);
      i++;
    } else {
      clearInterval(interval);
    }
  }, 250);
};

const imgRender = () => {
  if (preparedFiles.length) {
    preparedFiles.forEach((byte, i) => {
      const blob = new Blob([byte], {
        type: "image/png",
      });
      const url = window.URL.createObjectURL(blob);
      urls.push(url);
      const imgName = `unpackedImg_${i}__${createHash()}`;
      const newImgElement = document.createElement("img");
      newImgElement.src = url;
      newImgElement.alt = imgName;
      newImgElement.title = imgName;
      newImgElement.className = "img";
      newImgElement.addEventListener("click", () => {
        downloadURL(url, imgName);
      });
      box.appendChild(newImgElement);
    });
  }
};

const extractor = (
  event
  //file reader event
) => {
  const packedBytes = event.target?.result;

  if (packedBytes && typeof packedBytes !== "string") {
    const int8Bytes = new Uint8Array(packedBytes);
    let isIterate = false,
      number = 0;

    const structuredInt8Bytes = int8Bytes.reduce(
      (structuredArray, byte, i, src) => {
        if (!isIterate) {
          if (
            byte === 137 &&
            src[i + 1] === 80 &&
            src[i + 2] === 78 &&
            src[i + 3] === 71 &&
            src[i + 4] === 13 &&
            src[i + 5] === 10
          ) {
            isIterate = true;

            structuredArray[number].push(byte);
          }
        } else {
          structuredArray[number].push(byte);
          if (
            byte === 130 &&
            src[i - 1] === 96 &&
            src[i - 2] === 66 &&
            src[i - 3] === 174 &&
            src[i - 4] === 68 &&
            src[i - 5] === 78 &&
            src[i - 6] === 69 &&
            src[i - 7] === 73
          ) {
            isIterate = false;
            number++;
            structuredArray.push([]);
          }
        }

        return [...structuredArray];
      },
      [[]]
    );
    structuredInt8Bytes.pop();

    const files = structuredInt8Bytes.map((img) => {
      const bufer = new Uint8Array(img);
      return bufer;
    });
    count.innerHTML = files.length;

    preparedFiles = files;
    buttonChanger(true);
  }
};

const inputListener = (
  event
  //file input event
) => {
  buttonChanger(false);
  let file = null; //File | null
  if (event.target.files !== null) {
    file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = extractor;
    reader.readAsArrayBuffer(file);
  }
};

input.addEventListener("change", inputListener);
button.addEventListener("click", imgRender);
clearButton.addEventListener("click", clearImgs);
allButton.addEventListener("click", downloadAll);

function createHash(number = 4) {
  const letters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
  let hash = "";

  for (let i = 0; i < number; i++) {
    const random = Math.floor(Math.random() * letters.length);
    hash += letters[random];
  }
  return hash;
}
