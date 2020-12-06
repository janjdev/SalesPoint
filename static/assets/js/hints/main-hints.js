$(document).ready( function() {
    
    
    
    
    
    //initialize instance
  var enjoyhint_instance = new EnjoyHint({});
  
  //simple config. 
  //Only one step - highlighting(with description) "New" button 
  //hide EnjoyHint after a click on the button.
  var enjoyhint_script_steps = [
    {
      'next #routes' : 'Welcome to SalesPoint.\n These six buttons are the entry to your application. \n Be sure to have you\'re six digit ID ready and let\'s go over each button. '
    },
    {
      'next #admin' : 'Click here, BACK OFFICE, to enter the Administrative dashboard.'
    },
    { 
      'next #dinein' : 'Click here to create a dine-in order.'
    },
    { 
      'next #carryout' : 'Click here to create an order for carryout.'
    },
    { 
      'next #kitchen' : 'Click here, KITCHEN, to view current tickets.'
    },
    { 
      'next #orders' : 'Click here, ORDERS, to view, complete, or change an order.'
    },
    { 
      'next #shutdown' : 'Click SHUT DOWN to exit the app.'
    },
    { 
      'next #tourbtn' : 'Click here run this guide again.'
    },
    { 
      'click #routes' : 'Click One of the buttons to begin.'
    }
  ];
  
  
  //set script config
  enjoyhint_instance.set(enjoyhint_script_steps);
  
  //run Enjoyhint script
  enjoyhint_instance.run();

  $(document).on('click', '#tourbtn', function(e){
   let reRun = new EnjoyHint({});
   reRun.set(enjoyhint_script_steps);
   reRun.run();
  });
    
  });
  