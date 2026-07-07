// Countdown to 27 January 2027, midnight IST
const WEDDING = new Date("2027-01-27T00:00:00+05:30");

const els = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

const pad = (n) => String(n).padStart(2, "0");

function tick() {
  const diff = WEDDING - new Date();

  if (diff <= 0) {
    document.querySelector(".countdown").innerHTML =
      '<p class="its-time">It’s happening! ❤️</p>';
    clearInterval(timer);
    return;
  }

  els.days.textContent = Math.floor(diff / 86400000);
  els.hours.textContent = pad(Math.floor(diff / 3600000) % 24);
  els.minutes.textContent = pad(Math.floor(diff / 60000) % 60);
  els.seconds.textContent = pad(Math.floor(diff / 1000) % 60);
}

const timer = setInterval(tick, 1000);
tick();
