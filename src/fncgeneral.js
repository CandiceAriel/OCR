const canvas = document.getElementById("cv1")
const canvas2 = document.getElementById("cv2")
const ctx = cv1.getContext("2d");
const ctx2 = cv2.getContext("2d");
const upload = document.getElementById("upload");

// Memuat gambar saat pengguna memilih file
upload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      // Image preprocessing - Konversi ke Grayscale
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      const imgData = imageData.data;
      for (let i = 0; i < imgData.length; i += 4) {
        const avg = (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
        imgData[i] = avg; // R
        imgData[i + 1] = avg; // G
        imgData[i + 2] = avg; // B
      }
      ctx.putImageData(imageData, 0, 0);

      // Peningkatan Kontras
      for (let i = 0; i < imgData.length; i += 4) {
        if (imgData[i] < 124) {
          // Ambang batas yang dapat disesuaikan
          imgData[i] = 0; // R
          imgData[i + 1] = 0; // G
          imgData[i + 2] = 0; // B
        } else {
          imgData[i] = 255; // R
          imgData[i + 1] = 255; // G
          imgData[i + 2] = 255; // B
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Menggunakan Tesseract.js untuk membaca teks dari gambar
      Tesseract.recognize(canvas, "eng+spa", {
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<",
        preserve_interword_spaces: "10",
      }).then(({ data }) => {
        const detectedText = data.text; // Teks yang terdeteksi oleh Tesseract.js

        // Mengambil 2 baris terakhir
        const lines = detectedText.split("\n");
        const lastTwoLines = lines.slice(-3);
        const mergedText = lastTwoLines.join("\n");

        console.log(mergedText);

        // Menggambar kotak merah di sekitar teks yang terdeteksi
        const textRegions = data.words.map((word) => word.bbox);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        textRegions.forEach((region) => {
          ctx.beginPath();
          ctx.rect(
            region.x0,
            region.y0,
            region.x1 - region.x0,
            region.y1 - region.y0
          );
          ctx.stroke();
        });
      });
    };
    image.src = e.target.result;
  };

  reader.readAsDataURL(file);
});
