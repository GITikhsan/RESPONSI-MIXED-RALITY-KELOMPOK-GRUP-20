let handPose;
let video;
let hands = [];
let canvasLayer;

const polaAngka7 = [
  { x: 200, y: 150 }, { x: 275, y: 150 }, { x: 350, y: 150 }, { x: 425, y: 150 },
  { x: 395, y: 225 }, { x: 365, y: 300 }, { x: 335, y: 375 }, { x: 305, y: 450 }
];

const koneksiTulang = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

let targetTitik = 0;
let statusGame = "MULAI";
let garisSaatIni = [];
let frameHilang = 0;
let waktuPesan = 0;
let pesanGagal = "";

function jarakKeGaris(p, v, w) {
  let l2 = Math.pow(w.x - v.x, 2) + Math.pow(w.y - v.y, 2);
  if (l2 === 0) return dist(p.x, p.y, v.x, v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
}

function preload() {
  handPose = ml5.handPose({ flipped: true, maxHands: 1 });
}

function setup() {
  createCanvas(640, 480);
  
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  
  handPose.detectStart(video, gotHands);
  
  canvasLayer = createGraphics(640, 480);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background(40);

  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (statusGame === "GAGAL" || statusGame === "BERHASIL") {
    waktuPesan--;
    if (waktuPesan <= 0) {
      targetTitik = 0;
      statusGame = "MULAI";
      garisSaatIni = [];
      canvasLayer.clear();
    }
  }

  for (let i = 0; i < polaAngka7.length; i++) {
    if (i < targetTitik) {
      fill(0, 255, 0);
    } else if (i === targetTitik) {
      fill(255, 255, 0);
    } else {
      fill(255, 255, 255, 180);
    }
    
    stroke(0, 150, 255);
    strokeWeight(3);
    circle(polaAngka7[i].x, polaAngka7[i].y, 30);
    
    fill(0);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text(i + 1, polaAngka7[i].x, polaAngka7[i].y);
  }

  if (hands.length > 0 && (statusGame === "MULAI" || statusGame === "PROSES")) {
    frameHilang = 0;
    let hand = hands[0];

    stroke(255);
    strokeWeight(2);
    for (let i = 0; i < koneksiTulang.length; i++) {
      let a = hand.keypoints[koneksiTulang[i][0]];
      let b = hand.keypoints[koneksiTulang[i][1]];
      line(a.x, a.y, b.x, b.y);
    }

    noStroke();
    fill(255, 0, 0);
    for (let i = 0; i < hand.keypoints.length; i++) {
      let kp = hand.keypoints[i];
      circle(kp.x, kp.y, 10);
    }

    let ujungTelunjuk = hand.keypoints[8];
    if (ujungTelunjuk) {
      let pFinger = { x: ujungTelunjuk.x, y: ujungTelunjuk.y };

      if (statusGame === "PROSES" && targetTitik > 0) {
        let deviasi = jarakKeGaris(pFinger, polaAngka7[targetTitik - 1], polaAngka7[targetTitik]);
        if (deviasi > 45) {
          statusGame = "GAGAL";
          waktuPesan = 75;
          pesanGagal = "GAGAL! Garis keluar dari jalur";
        }
      }

      if (statusGame !== "GAGAL") {
        let d = dist(pFinger.x, pFinger.y, polaAngka7[targetTitik].x, polaAngka7[targetTitik].y);
        
        if (d < 30) {
          if (statusGame === "MULAI") {
            statusGame = "PROSES";
          }
          
          targetTitik++;
          
          if (targetTitik >= polaAngka7.length) {
            statusGame = "BERHASIL";
            waktuPesan = 90;
          }
        }

        if (statusGame === "PROSES") {
          garisSaatIni.push({ x: pFinger.x, y: pFinger.y });

          if (garisSaatIni.length >= 2) {
            canvasLayer.stroke(0, 255, 0);
            canvasLayer.strokeWeight(12);
            canvasLayer.strokeJoin(ROUND);
            let p1 = garisSaatIni[garisSaatIni.length - 2];
            let p2 = garisSaatIni[garisSaatIni.length - 1];
            canvasLayer.line(p1.x, p1.y, p2.x, p2.y);
          }
        } else {
          garisSaatIni = [];
        }
      }
    }
  } else if (statusGame === "PROSES") {
    frameHilang++;
    if (frameHilang > 15) {
      statusGame = "GAGAL";
      waktuPesan = 75;
      pesanGagal = "GAGAL! Jari terangkat sebelum selesai";
    }
  }

  image(canvasLayer, 0, 0);

  if (statusGame === "GAGAL") {
    fill(255, 0, 0, 200);
    noStroke();
    rect(0, height / 2 - 40, width, 80);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(pesanGagal, width / 2, height / 2);
  } else if (statusGame === "BERHASIL") {
    fill(0, 255, 0, 200);
    noStroke();
    rect(0, height / 2 - 40, width, 80);
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    text("HEBAT! Angka 7 selesai", width / 2, height / 2);
  }
}
