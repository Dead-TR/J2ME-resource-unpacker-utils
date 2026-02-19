// worker.js

const IMAGE_SIGNATURES = {
  png: {
    mime: "image/png",
    start: [137, 80, 78, 71, 13, 10, 26, 10],
    end: [73, 69, 78, 68, 174, 66, 96, 130],
  },
};

function matchSignature(bytes, position, signature) {
  if (position < 0) return false;

  for (let i = 0; i < signature.length; i++) {
    if (bytes[position + i] !== signature[i]) return false;
  }
  return true;
}

self.onmessage = function (event) {
  try {
    const { buffer, type } = event.data;
    const bytes = new Uint8Array(buffer);
    const { start, end } = IMAGE_SIGNATURES[type];

    let currentStart = null;
    let foundCount = 0;

    const total = bytes.length;
    const progressStep = Math.max(1, Math.floor(total / 200));

    for (let i = 0; i < total; i++) {

      if (currentStart === null && matchSignature(bytes, i, start)) {
        currentStart = i;
      }

      if (currentStart !== null) {
        if (matchSignature(bytes, i - end.length + 1, end)) {
          const imageBytes = bytes.slice(currentStart, i + 1);

          foundCount++;

          // 🔥 Віддаємо файл одразу
          self.postMessage({
            type: "found",
            file: imageBytes,
            count: foundCount,
          }, [imageBytes.buffer]); // transferable

          currentStart = null;
        }
      }

      if (i % progressStep === 0) {
        self.postMessage({
          type: "progress",
          percent: ((i / total) * 100).toFixed(2),
          processedBytes: i,
          totalBytes: total,
          found: foundCount,
        });
      }
    }

    self.postMessage({
      type: "done",
      found: foundCount,
    });

  } catch (error) {

    self.postMessage({
      type: "error",
      message: error.message,
    });
  }
};
