window.addEventListener('DOMContentLoaded', () => {

    let tasks = document.querySelectorAll('.printer-tasks');
    let page, title;



    tasks.forEach(function(task) {
        task.addEventListener('click', function(e){      
          page = task.getAttribute('data-href');
          title = task.getAttribute('data-tile'); 
          console.log(tasks);
        });
    });




});