//function to show running clock
function startTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    let afternoon = (h >= 12) ? "PM" : "AM";
    h = (h == 0) ? 12 : ((h > 12) ? (h - 12): h);
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('ctime').innerHTML =
    h + ":" + m + ":" + s + " " + afternoon;
    var t = setTimeout(startTime, 500);
  }
  function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
  }

  window.addEventListener('DOMContentLoaded', () => {
    startTime();
  });