const initialChannel =
    new URL(window.location).searchParams.get("channel") ?? null;
const channel = initialChannel ?? randomID();
const BROADCAST_URL = `https://marinm.net/broadcast?channel=${channel}`;
const SHARE_URL = `https://marinm.net/rocket/?channel=${channel}`;

let webSocket = null;
let connectedAt = null;
let tappedAt = null;

const container = document.getElementById("container");
const bigHeart = document.getElementById("big-heart");
const square = document.getElementById("square");
const randomNumber = document.getElementById("random-number");
const popup = document.getElementById("popup");
const qrcodeContainer = document.getElementById("qrcode-container");

const animations = ["float-1", "float-2", "float-3", "float-4"];

let timeoutId = null;

connect();

popup.style.visibility = "hidden";

square.addEventListener("click", openPopup);

const qrcode = new QRCode(qrcodeContainer, {
    width: qrcodeContainer.clientWidth,
    height: qrcodeContainer.clientWidth,
});

qrcode.makeCode(SHARE_URL);

bigHeart.addEventListener("click", () => {
    tappedAt = Date.now();
    growHeart();

    if (webSocket == null || webSocket.readyState == WebSocket.CLOSED) {
        connect();
        return;
    }
    if (webSocket?.readyState !== WebSocket.OPEN) {
        return;
    }
    console.log("send");
    webSocket.send(randomAnimation());
});

function randomID() {
    const array = new Uint32Array(1);
    self.crypto.getRandomValues(array);

    const result = array[0].toString().padStart(10, "0").slice(1);

    const segments = [
        result.slice(0, 3),
        result.slice(3, 6),
        result.slice(6, 9),
    ];

    return segments.join("-");
}

function openPopup() {
    popup.style.visibility =
        popup.style.visibility === "hidden" ? "visible" : "hidden";
}

function growHeart() {
    bigHeart.classList.add("tapped");
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        bigHeart.classList.remove("tapped");
    }, 250);
}

function randomAnimation() {
    return animations[Math.floor(Math.random() * animations.length)];
}

function newHeart(animation) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.textContent = "🚀";
    heart.style.animationName = animation;
    heart.style.animationDuration = "1500ms";
    container.appendChild(heart);
    heart.onanimationend = ({ target }) => target.remove();
}

function connect() {
    webSocket = new WebSocket(BROADCAST_URL);

    webSocket.addEventListener("open", () => {
        console.log("open");
        connectedAt = Date.now();
        bigHeart.classList.remove("grayscale");
    });

    webSocket.addEventListener("close", () => {
        console.log("close");
        const now = Date.now();
        const tappedMessage = tappedAt
            ? `or ${now - tappedAt} ms since tapped`
            : "not tapped";
        console.log(
            `connection lasted ${now - connectedAt} ms, ${tappedMessage}`
        );
        bigHeart.classList.add("grayscale");
    });

    webSocket.addEventListener("message", (event) => {
        const animation = String(event.data);

        if (animations.includes(animation)) {
            newHeart(animation);
        }
    });
}
