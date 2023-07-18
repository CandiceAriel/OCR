// const { createWorker, PSM} = Tesseract;
var promises_1 = require("fs").promises;
const { log } = require("console");
const { createWorker } = require("tesseract.js");
const parse = require("mrz").parse;

const progress = document.getElementById("progress");
const textarea = document.getElementById("textarea");
const canvas = document.getElementById("cv1");
const canvas2 = document.getElementById("cv2");
const ctx = cv1.getContext("2d");
const ctx2 = cv2.getContext("2d");

document.querySelector('input[type="file"]').onchange = function () {
  let img = this.files[0];
  let reader = new FileReader();
  reader.readAsDataURL(img);
  reader.onload = function () {
    drawImage(reader.result);
  };
};

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

    preprocessImage(canvas2);
    scanImg(dataURL, "spa+ces");
  };
}

async function scanImg(src, lang) {
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
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<",
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

  console.log(mrzRes);
  const stringed = JSON.stringify(mrzRes);
  // console.log(stringed);
  textarea.innerHTML = 
  "MRZ Scanner = " + "\n" + line1 + "\n" + line2 + "\n" + "\n" +
  "Document Code = " + mrzRes[0] + "\n" + 
  "Issuing State = " + mrzRes[1] + "\n" + 
  "Last Name = " + mrzRes[2] + "\n" +
  "First Name = " + mrzRes[3] + "\n" +
  "Document Number = " + mrzRes[4] + "\n" +
  "Document NumberCheckDigit = " + mrzRes[5] + "\n" +
  "Nationality = " + mrzRes[6] + "\n" +
  "BirthDate = " + mrzRes[7] + "\n" +
  "BirthDate CheckDigit = " + mrzRes[8] + "\n" +
  "Sex = " + mrzRes[9] + "\n" +
  "Expiration Date = " + mrzRes[10] + "\n" +
  "Expiration DateCheckDigit = " + mrzRes[11] + "\n" +
  "Personal Number = " + mrzRes[12] + "\n" +
  "Personal Number CheckDigit = " + mrzRes[13] + "\n" +
  "Composite CheckDigit = " + mrzRes[14];
  
}

function preprocessImage(canvas) {
  convertToGrayscale(canvas);
  increaseContrast(canvas);
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
