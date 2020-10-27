 //Auto logoff timer

 function autoLogoff(){

        

    window.onmousemove = resetTimer; // catches mouse movements
    window.onmousedown = resetTimer; // catches mouse movements
    window.onclick = resetTimer;     // catches mouse clicks
    window.onscroll = resetTimer;    // catches scrolling
    window.onkeypress = resetTimer;  //catches keyboard actions

    let countDown =  setInterval(function() {   ct = ct-1; document.getElementById("outTime").innerHTML = ct; }, 1000);
    

    let timer = setTimeout(function(){
        // Update the count down every 1 second
        let ct = 60;
        countDown();            
    }, 5000);

         function resetTimer(){
        clearTimeout(timer);
        clearInterval(countDown);
        document.getElementById("outTime").innerHTML = "";                     
    }
    
        
}

var warningTimeout = 5000;
var timoutNow = 60000;
var warningTimerID,timeoutTimerID;

function startTimer() {
    // window.setTimeout returns an Id that can be used to start and stop a timer
    warningTimerID = window.setTimeout(warningInactive, warningTimeout);
}

function warningInactive() {
    window.clearTimeout(warningTimerID);
    timeoutTimerID = window.setTimeout(IdleTimeout, timoutNow);
    
}

function resetTimer() {
    window.clearTimeout(timeoutTimerID);
    window.clearTimeout(warningTimerID);
    startTimer();
}

// Logout the user.
function IdleTimeout() {

    //Do ajax call to logoff
    document.getElementById('logout-form').submit();
}

function setupTimers () {
    document.addEventListener("mousemove", resetTimer, false);
    document.addEventListener("mousedown", resetTimer, false);
    document.addEventListener("keypress", resetTimer, false);
    document.addEventListener("touchmove", resetTimer, false);
    document.addEventListener("onscroll", resetTimer, false);
    startTimer();
}

//if modal is canceld
$(document).on('click','#btnStayLoggedIn',function(){
    //ajax to logout
    resetTimer();
    $('#modalAutoLogout').modal('hide');
});

$(document).ready(function(){
    setupTimers();
});

window.addEventListener('DOMContentLoaded', () => {    
    autoLogoff();
  });