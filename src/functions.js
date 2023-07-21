// const { createWorker, PSM} = Tesseract;
const { createWorker } = require("tesseract.js");
const parse = require("mrz").parse;

const textarea = document.getElementById("textarea");
const canvas = document.getElementById("cv1");
const canvas2 = document.getElementById("cv2");
const ctx = cv1.getContext("2d");
const ctx2 = cv2.getContext("2d");

var docType = "";

document.querySelector('input[type="file"]').onchange = function () {
  let img = this.files[0];
  let reader = new FileReader();
  reader.readAsDataURL(img);
  reader.onload = function () {
    drawImage(reader.result);
  };
};

$("#doc-type").change(function () {
  docType = $(this).val();
  textarea.innerHTML = "";
});
console.log(docType);

function drawImage(url) {
  let image = new Image();
  image.src = url;
  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const dataURI = canvas.toDataURL("image/jpeg");

    canvas2.width = image.width;
    canvas2.height = image.height;
    ctx2.drawImage(image, 0, 0);
    const dataURL = canvas2.toDataURL("image/jpeg");

    // preprocessImage(canvas2);

    //Set different methods of scanning and preprocessing based on Doc type
    if (docType === "ktp") {
      scanImg(dataURL, "spa+ces");
    } else if (docType === "passport") {
      scanPassport(dataURL, "spa+ces");
      preprocessImagePassport(canvas2);
    } else if (docType === "general-docs") {
      
      scanGeneralDoc(dataURL, "eng");
    } else {
      console.log("error");
    }
  };
}

//For General Doc
async function scanGeneralDoc(src, lang) {

  preprocessImageGeneralDoc(canvas2);
  const dtTxt = [];

  //use worker
  const worker = await createWorker({});
  await worker.loadLanguage(lang); // 2
  await worker.initialize(lang);
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<",
    preserve_interword_spaces: "1",
  });
  const {
    data: { text, words },
  } = await worker.recognize(canvas2);
  await worker.terminate();

  const textRegions = words.map((word) => word.bbox);
  ctx2.lineWidth = 2;
  ctx2.strokeStyle = "red";
  textRegions.forEach((region) => {
    ctx2.beginPath();
    ctx2.rect(
      region.x0,
      region.y0,
      region.x1 - region.x0,
      region.y1 - region.y0
    );
    ctx2.stroke();
  });

  const textVal = words.map((word) => word.text);
  textVal.forEach((txt) => {
    dtTxt.push(txt);
  });

  textarea.innerHTML = text;
}

//For Passport
async function scanPassport(src, lang) {
  const dtTxt = [];
  // Tesseract.recognize(
  //   src,
  //   lang, {
  //   tessedit_char_whitelist:
  //     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<",
  //   preserve_interword_spaces: "10",
  // }).then(({ data }) => {
  //   const detectedText = data.text; // Teks yang terdeteksi oleh Tesseract.js
  //   console.log(data);

  //   // Mengambil 2 baris terakhir
  //   const lines = detectedText.split("\n");
  //   const lastTwoLines = lines.slice(-3);
  //   const mergedText = lastTwoLines.join("\n");

  //   console.log(mergedText);

  //   // Menggambar kotak merah di sekitar teks yang terdeteksi
  //   const textRegions = data.words.map((word) => word.bbox);
  //   ctx2.lineWidth = 2;
  //   ctx2.strokeStyle = "red";
  //   textRegions.forEach((region) => {
  //     ctx2.beginPath();
  //     ctx2.rect(
  //       region.x0,
  //       region.y0,
  //       region.x1 - region.x0,
  //       region.y1 - region.y0
  //     );
  //     ctx2.stroke();
  //   });
  // });

  //use worker

  const worker = await createWorker({});
  await worker.loadLanguage(lang); // 2
  await worker.initialize(lang);
  await worker.setParameters({
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<#-",
    preserve_interword_spaces: "10",
  });
  const {
    data: { text, words },
  } = await worker.recognize(src);
  await worker.terminate();

  const textRegions = words.map((word) => word.bbox);
  ctx2.lineWidth = 2;
  ctx2.strokeStyle = "red";
  textRegions.forEach((region) => {
    ctx2.beginPath();
    ctx2.rect(
      region.x0,
      region.y0,
      region.x1 - region.x0,
      region.y1 - region.y0
    );
    ctx2.stroke();
  });

  const textVal = words.map((word) => word.text);
  textVal.forEach((txt) => {
    dtTxt.push(txt);
  });

  parseMRZ(text);
}

function parseMRZ(mrzTxt) {
  //Array for RAW parse result
  const mrzArr = [];
  //Array for mapped parse result
  const ressArr = [
    {
      field: "",
      val: "",
    },
  ];

  const lines = mrzTxt.split("\n");
  const lastTwoLines = lines.slice(-3);
  const mergedText = lastTwoLines.join("\n");

  const mrz = mergedText.split("\n");
  const line1 = mrz[0];
  const line2 = mrz[1];

  mrzArr.push(line1, line2);
  var result = parse(mrzArr);

  const mrzRes = result.details.map((dt) => dt.value);
  ressArr.push(mrzRes);

  // console.log(mrzRes);
  const stringed = JSON.stringify(mrzRes);
  // console.log(stringed);
  textarea.innerHTML =
    "MRZ Scanner = " +
    "\n" +
    line1 +
    "\n" +
    line2 +
    "\n" +
    "\n" +
    "Type/Type = " +
    mrzRes[0] +
    "\n" +
    "Issuing Country = " +
    mrzRes[1] +
    "\n" +
    "Surname = " +
    mrzRes[2] +
    "\n" +
    "Given Names = " +
    mrzRes[3] +
    "\n" +
    "Passport No. = " +
    mrzRes[4] +
    "\n" +
    "Document NumberCheckDigit = " +
    mrzRes[5] +
    "\n" +
    "Nationality = " +
    mrzRes[6] +
    "\n" +
    "BirthDate = " +
    mrzRes[7] +
    "\n" +
    "BirthDate CheckDigit = " +
    mrzRes[8] +
    "\n" +
    "Sex = " +
    mrzRes[9] +
    "\n" +
    "Expiration Date = " +
    mrzRes[10] +
    "\n" +
    "Expiration DateCheckDigit = " +
    mrzRes[11] +
    "\n" +
    "Personal Number = " +
    mrzRes[12] +
    "\n" +
    "Personal Number CheckDigit = " +
    mrzRes[13] +
    "\n" +
    "Composite CheckDigit = " +
    mrzRes[14];
}

function preprocessImagePassport(canvas) {
  convertToGrayscale(canvas);
  increaseContrast(canvas);
}

function preprocessImageGeneralDoc(canvas) {
  // Crop gambar di bagian kanan
  cropImage(canvas, 600, 0, 200, 275);
}

function convertToGrayscale(cv) {
  //Convert Img to Grayscale
  const imageData = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height);

  const imgData = imageData.data;
  for (let i = 0; i < imgData.length; i += 4) {
    const avg = (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
    imgData[i] = avg; // R
    imgData[i + 1] = avg; // G
    imgData[i + 2] = avg; // B
  }
  cv.getContext("2d").putImageData(imageData, 0, 0);
}

function increaseContrast(cv) {
  const cvDt = cv.getContext("2d");
  const imageData = cvDt.getImageData(0, 0, cv.width, cv.height);

  const imgData = imageData.data;
  // Inncrease contrast
  for (let i = 0; i < imgData.length; i += 4) {
    if (imgData[i] < 124) {
      // Can be adjusted
      imgData[i] = 0; // R
      imgData[i + 1] = 0; // G
      imgData[i + 2] = 0; // B
    } else {
      imgData[i] = 255; // R
      imgData[i + 1] = 255; // G
      imgData[i + 2] = 255; // B
    }
  }
  cvDt.putImageData(imageData, 0, 0);
}

function cropImage(canvas, topBoundary, rightBoundary, bottomBoundary, leftBoundary) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Hanya ambil piksel di bagian atas, kanan, bawah, dan kiri gambar
  for (let y = 0; y < topBoundary; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      imageData.data[pixelIndex + 3] = 0; // Atur alpha channel ke 0 (transparan)
    }
  }

  for (let y = topBoundary; y < canvas.height - bottomBoundary; y++) {
    for (let x = 0; x < leftBoundary; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      imageData.data[pixelIndex + 3] = 0; // Atur alpha channel ke 0 (transparan)
    }

    for (let x = canvas.width - rightBoundary; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      imageData.data[pixelIndex + 3] = 0; // Atur alpha channel ke 0 (transparan)
    }
  }

  for (let y = canvas.height - bottomBoundary; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      imageData.data[pixelIndex + 3] = 0; // Atur alpha channel ke 0 (transparan)
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
