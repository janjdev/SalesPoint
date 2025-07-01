
let warningTimeout= document.getElementById('timer').innerHTML * 60*1000;
let warningTime = 60;
var timeoutNow = warningTime*1000;
var warningTimerID,timeoutTimerID, timer;

function myTimer() {   
    warningTime--;
  document.getElementById("outTime").innerHTML = 'Auto logoff in: ' + formatTime(warningTime);
}

function stopTimer() {
  clearInterval(timer);
  warningTime = 60;
  document.getElementById("outTime").innerHTML = "";
}

function startTimer() {
    // window.setTimeout returns an Id that can be used to start and stop a timer
    warningTimerID = window.setTimeout(warningInactive, warningTimeout);  
}

function warningInactive() {
    timer = setInterval(myTimer, 1000);
    window.clearTimeout(warningTimerID);
    timeoutTimerID = window.setTimeout(IdleTimeout, timeoutNow);
}

function resetTimer() {
    window.clearTimeout(timeoutTimerID);
    window.clearTimeout(warningTimerID);
    stopTimer();
    startTimer();
}

function IdleTimeout() {   
    // window.clearTimeout(timeoutTimerID);
    // window.clearTimeout(warningTimerID);
    stopTimer();
    $('#modalAutoLogout').modal('show');

}

function formatTime(timeInSeconds) {
	var minutes = Math.floor(timeInSeconds / 60);
	var seconds = timeInSeconds % 60;
	if ( minutes < 10 ) { minutes = "0" + minutes; }
	if ( seconds < 10 ) { seconds = "0" + seconds; }
	return minutes + ":" + seconds;
}

function setupTimers () {
    document.addEventListener("mousemove", resetTimer, false);
    document.addEventListener("mousedown", resetTimer, false);
    document.addEventListener("keypress", resetTimer, false);
    document.addEventListener("touchmove", resetTimer, false);
    document.addEventListener("onscroll", resetTimer, false);
    startTimer();
}
window.addEventListener('DOMContentLoaded', () => {
    const settime = document.getElementById('timer').innerHTML * 60;
    const isset = document.getElementById('settime').innerHTML;  
    const authform = document.getElementById('reAuth');
    isValid = true
    // const logoutbtn = document.getElementById('forcelogout');
    if(isset == "checked")
    {
        setupTimers();
    }  

    $(document).on('click', '#forcelogout', function(e){
        e.preventDefault();
        window.location.replace("/logout");
    });
    
    $(document).on('click', '#forceAuth', function(e){
        e.preventDefault();
        console.log('default prevented');
        $(authform).trigger('submit');

    });

    jQuery(authform).on('submit', function(e){
        e.preventDefault();    
        validate(authform.querySelectorAll('input'));
        if(isValid){
            ajaxforms('/auth', 'POST', authform)
        }else{
            noMatch(authform);
            isValid = true;
        } 
        });


    function validate(args){
        let fields = [];
        args.forEach(el => fields.push(el));
        fields.forEach(function(el){
          if (el.value == '' || /\S/.test(el.value) == false)
          {
            isValid = false;
          }     
        });    
    
      }

      function noMatch(form){
        jQuery(form).parent().parent().addClass('animated shake');
         setTimeout(function(){
           jQuery(form).parent().parent().removeClass('animated shake');
         }, 1000);
       }

      // ====================Ajax==========================
      function ajaxforms(url, type, form){
        $.ajax({
          url: url,
          type: type,
          data: $(form).serialize()
        })
        .done(function(response){
          let callback = eval(response.callback)
          if(response.param){
            if(response.param == 'form'){
              callback = callback(form)
            }
            else{
              callback = callback(response.param)
            }
          }
          Swal.fire({
            type: response.alertType,
            title: response.title,
            text: response.message,
            timer: response.timer,
            onClose: callback
          })
          
        })
      }
    
});

// ============CallBack==============
function reAuth(){
    resetTimer();
    $('#modalAutoLogout').modal('hide');
    document.getElementById('reAuth').reset();

}